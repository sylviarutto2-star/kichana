
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id),
  phone_number text NOT NULL,
  amount numeric NOT NULL,
  merchant_request_id text,
  checkout_request_id text,
  status text NOT NULL DEFAULT 'pending',
  mpesa_receipt_number text,
  result_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bookings WHERE bookings.id = payments.booking_id AND bookings.customer_id = auth.uid()
  ));

CREATE POLICY "System can insert payments" ON public.payments
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "System can update payments" ON public.payments
  FOR UPDATE TO public
  USING (true);

CREATE POLICY "Anyone can select by checkout_request_id" ON public.payments
  FOR SELECT TO public
  USING (true);
