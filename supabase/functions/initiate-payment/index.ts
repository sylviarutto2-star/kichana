// M-Pesa Buy Goods STK Push — initiate-payment
// TransactionType: CustomerBuyGoodsOnline (Buy Goods / Till Number)
// Going live checklist: update MPESA_ENVIRONMENT, MPESA_TILL_NUMBER, MPESA_PASSKEY,
// MPESA_CALLBACK_URL, MPESA_CONSUMER_KEY, and MPESA_CONSUMER_SECRET secrets only.

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

function getUtcTimestamp() {
  const now = new Date();
  return (
    now.getUTCFullYear().toString() +
    String(now.getUTCMonth() + 1).padStart(2, '0') +
    String(now.getUTCDate()).padStart(2, '0') +
    String(now.getUTCHours()).padStart(2, '0') +
    String(now.getUTCMinutes()).padStart(2, '0') +
    String(now.getUTCSeconds()).padStart(2, '0')
  );
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

    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
    const tillNumber = Deno.env.get('MPESA_TILL_NUMBER');
    const passkey = Deno.env.get('MPESA_PASSKEY');
    const environment = Deno.env.get('MPESA_ENVIRONMENT') || 'sandbox';
    const fallbackCallbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`;
    const configuredCallbackUrl = Deno.env.get('MPESA_CALLBACK_URL');
    const callbackUrl = configuredCallbackUrl && /^https?:\/\//i.test(configuredCallbackUrl)
      ? configuredCallbackUrl
      : fallbackCallbackUrl;

    if (configuredCallbackUrl && callbackUrl === fallbackCallbackUrl) {
      console.warn(`Invalid MPESA_CALLBACK_URL secret detected: ${configuredCallbackUrl}. Falling back to ${fallbackCallbackUrl}`);
    }

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

    const formattedPhone = formatPhone(phone_number);
    if (!/^254[17]\d{8}$/.test(formattedPhone)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid Kenyan phone number. Use format 07XXXXXXXX or 01XXXXXXXX' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    const authResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}`,
      },
    });
    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    if (!accessToken) {
      console.error('Daraja OAuth error:', JSON.stringify(authData));
      return new Response(
        JSON.stringify({ success: false, error: `Failed to get Daraja access token: ${JSON.stringify(authData)}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const timestamp = getUtcTimestamp();
    const password = btoa(`${tillNumber}${passkey}${timestamp}`);

    const stkBody = {
      BusinessShortCode: tillNumber,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerBuyGoodsOnline',
      Amount: Math.round(Number(amount)),
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
          error: `${stkData.errorMessage || stkData.ResponseDescription || 'STK Push failed'} | ${JSON.stringify(stkData)}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: insertError } = await supabase.from('payments').insert({
      booking_id,
      phone_number: formattedPhone,
      amount: Math.round(Number(amount)),
      merchant_request_id: stkData.MerchantRequestID,
      checkout_request_id: stkData.CheckoutRequestID,
      status: 'pending',
    });

    if (insertError) {
      console.error('Insert payment error:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: `Payment request created but failed to store locally: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, checkout_request_id: stkData.CheckoutRequestID }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('initiate-payment error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});