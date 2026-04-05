import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const tillNumber = Deno.env.get('MPESA_TILL_NUMBER') || '174379';
    const passkey = Deno.env.get('MPESA_PASSKEY') || '';
    const environment = Deno.env.get('MPESA_ENVIRONMENT') || 'sandbox';
    const callbackUrl = Deno.env.get('MPESA_CALLBACK_URL') ||
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`;

    const baseUrl = environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    // Format phone number to 2547XXXXXXXX or 2541XXXXXXXX
    let formattedPhone = phone_number.replace(/[\s\-]/g, '').replace(/[^0-9+]/g, '');
    if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    }
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    // Validate phone format
    if (!/^254[17]\d{8}$/.test(formattedPhone)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid Kenyan phone number. Use format 07XXXXXXXX or 01XXXXXXXX' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!consumerKey || !consumerSecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'M-PESA API credentials not configured. Please add MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Get OAuth token
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
      console.error('OAuth error:', JSON.stringify(authData));
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to get Daraja access token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Generate timestamp and password
    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    const password = btoa(`${tillNumber}${passkey}${timestamp}`);

    // Step 3: Send STK Push (Buy Goods)
    const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: tillNumber,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: tillNumber,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: booking_id,
        TransactionDesc: 'Salon booking payment',
      }),
    });

    const stkData = await stkResponse.json();
    console.log('STK Push response:', JSON.stringify(stkData));

    if (stkData.ResponseCode !== '0' && stkData.ResponseCode !== 0) {
      return new Response(
        JSON.stringify({ success: false, error: stkData.errorMessage || stkData.ResponseDescription || 'STK Push failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Save to payments table
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
