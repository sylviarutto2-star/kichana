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
    const body = await req.json();
    console.log('M-PESA Callback:', JSON.stringify(body));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const callback = body.Body?.stkCallback;
    if (!callback) {
      return new Response(JSON.stringify({ success: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resultCode = callback.ResultCode;
    const checkoutRequestID = callback.CheckoutRequestID;

    if (resultCode === 0) {
      // Payment successful
      const items = callback.CallbackMetadata?.Item || [];
      const receipt = items.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
      const amount = items.find((i: any) => i.Name === 'Amount')?.Value;
      const phone = items.find((i: any) => i.Name === 'PhoneNumber')?.Value;

      console.log('Payment successful:', { receipt, amount, phone });

      // Update transaction if we can find it
      // In production, store checkoutRequestID when creating the STK push
    } else {
      console.log('Payment failed:', callback.ResultDesc);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Callback error:', error);
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
