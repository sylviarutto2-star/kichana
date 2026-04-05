// M-Pesa Buy Goods STK Push — initiate-payment
// TransactionType: CustomerBuyGoodsOnline (Buy Goods / Till Number)
// NEVER use CustomerPayBillOnline — this app uses Buy Goods ONLY.
//
// Going live checklist (do not change code — update secrets only):
//   MPESA_ENVIRONMENT → production
//   MPESA_TILL_NUMBER → real Buy Goods till number
//   MPESA_PASSKEY → production passkey from Daraja portal
//   MPESA_CALLBACK_URL → production Edge Function URL if changed
//   MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET → production credentials

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatPhone(raw: string): string {
  let p = raw.replace(/[\s\-\(\)]/g, '').replace(/[^0-9+]/g, '');
  if (p.startsWith('+')) p = p.substring(1);
  if (p.startsWith('0')) p = '254' + p.substring(1);
  if (!p.startsWith('254')) p = '254' + p;
  return p;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone_number, amount, booking_id } = await req.json();

    if (!phone_number || !amount || !booking_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'phone_number, amount, and booking_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read secrets — never hardcode
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
    const tillNumber = Deno.env.get('MPESA_TILL_NUMBER');
    const passkey = Deno.env.get('MPESA_PASSKEY');
    const environment = Deno.env.get('MPESA_ENVIRONMENT') || 'sandbox';
    const callbackUrl = Deno.env.get('MPESA_CALLBACK_URL') ||
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`;

    if (!consumerKey || !consumerSecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'M-PESA API credentials not configured. Set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!tillNumber || !passkey) {
      return new Response(
        JSON.stringify({ success: false, error: 'M-PESA till number or passkey not configured. Set MPESA_TILL_NUMBER and MPESA_PASSKEY.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone to 254XXXXXXXXX
    const formattedPhone = formatPhone(phone_number);
    if (!/^254[17]\d{8}$/.test(formattedPhone)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid Kenyan phone number. Use format 07XXXXXXXX or 01XXXXXXXX' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Base URL based on environment
    const baseUrl = environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    // Step 1: OAuth token
    const authResponse = await fetch(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}`,
        },
      }
    );
    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    if (!accessToken) {
      console.error('Daraja OAuth error:', JSON.stringify(authData));
      return new Response(
        JSON.stringify({ success: false, error: `Failed to get Daraja access token: ${JSON.stringify(authData)}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Timestamp + Password
    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    const password = btoa(`${tillNumber}${passkey}${timestamp}`);

    // Step 3: STK Push — Buy Goods (CustomerBuyGoodsOnline)
    const stkBody = {
      BusinessShortCode: tillNumber,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerBuyGoodsOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: tillNumber,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: booking_id,
      TransactionDesc: 'Salon booking payment',
    };

    console.log('STK Push request body:', JSON.stringify(stkBody));

    const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkBody),
    });

    const stkData = await stkResponse.json();
    console.log('STK Push response:', JSON.stringify(stkData));

    if (stkData.ResponseCode !== '0' && stkData.ResponseCode !== 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: stkData.errorMessage || stkData.ResponseDescription || 'STK Push failed',
          daraja_response: stkData,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Save pending payment
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: insertError } = await supabase.from('payments').insert({
      booking_id,
      phone_number: formattedPhone,
      amount: Math.round(amount),
      merchant_request_id: stkData.MerchantRequestID,
      checkout_request_id: stkData.CheckoutRequestID,
      status: 'pending',
    });

    if (insertError) {
      console.error('Insert payment error:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkout_request_id: stkData.CheckoutRequestID,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('initiate-payment error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
