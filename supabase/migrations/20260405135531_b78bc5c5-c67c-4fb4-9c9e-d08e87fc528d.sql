
-- Fix: Drop the overly permissive "Anyone can select by checkout_request_id" policy on payments
DROP POLICY IF EXISTS "Anyone can select by checkout_request_id" ON public.payments;

-- Fix: Drop any remaining permissive system insert/update on payments (server-side only via service_role)
DROP POLICY IF EXISTS "System can insert payments" ON public.payments;
DROP POLICY IF EXISTS "System can update payments" ON public.payments;

-- Fix: Drop overly permissive transactions INSERT policy
DROP POLICY IF EXISTS "System can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Customers can create transactions" ON public.transactions;

-- Fix: Profiles - remove old overly permissive policy, replace with scoped ones
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can view public profile info" ON public.profiles;

-- Authenticated users can view all profiles (needed for stylist cards, chat names, etc.)
-- but email/phone should be hidden in app logic — only own profile shows sensitive fields
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Storage: Add DELETE and UPDATE policies (idempotent — drop first if they exist from prior migration)
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own portfolio" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own portfolio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own inspiration" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own inspiration" ON storage.objects;

CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own portfolio"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own portfolio"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'portfolio' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own inspiration"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'inspiration' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own inspiration"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'inspiration' AND (storage.foldername(name))[1] = auth.uid()::text);
