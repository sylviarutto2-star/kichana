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
    console.log('M-PESA Callback received:', JSON.stringify(body));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const callback = body.Body?.stkCallback;
    if (!callback) {
      console.error('No stkCallback in body');
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { ResultCode, ResultDesc, CheckoutRequestID, MerchantRequestID } = callback;

    if (ResultCode === 0) {
      // Payment successful — extract metadata
      const items = callback.CallbackMetadata?.Item || [];
      const receipt = items.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
      const amount = items.find((i: any) => i.Name === 'Amount')?.Value;
      const phone = items.find((i: any) => i.Name === 'PhoneNumber')?.Value;

      console.log('Payment success:', { receipt, amount, phone, CheckoutRequestID });

      // Update payment record
      const { data: payment, error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'success',
          mpesa_receipt_number: receipt?.toString() || null,
          result_description: ResultDesc,
          updated_at: new Date().toISOString(),
        })
        .eq('checkout_request_id', CheckoutRequestID)
        .select('booking_id')
        .single();

      if (updateError) {
        console.error('Update payment error:', updateError);
      }

      // Update booking status
      if (payment?.booking_id) {
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ deposit_paid: true, status: 'confirmed' })
          .eq('id', payment.booking_id);

        if (bookingError) {
          console.error('Update booking error:', bookingError);
        }
      }
    } else {
      // Payment failed or cancelled
      console.log('Payment failed:', { ResultCode, ResultDesc, CheckoutRequestID });

      const { error: failError } = await supabase
        .from('payments')
        .update({
          status: 'failed',
          result_description: ResultDesc,
          updated_at: new Date().toISOString(),
        })
        .eq('checkout_request_id', CheckoutRequestID);

      if (failError) {
        console.error('Update failed payment error:', failError);
      }
    }

    // Always return success to Safaricom
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: 'Success' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Callback error:', error);
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
