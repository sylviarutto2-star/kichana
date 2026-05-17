-- services: new fields (keep existing name/price/duration columns intact)
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS subcategory text,
  ADD COLUMN IF NOT EXISTS deposit_override integer,
  ADD COLUMN IF NOT EXISTS hair_type_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS intro_offer_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS intro_offer_percent integer,
  ADD COLUMN IF NOT EXISTS duration_min integer,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- portfolio_images: cover, ordering, captions, service link
ALTER TABLE public.portfolio_images
  ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_cover boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS caption text;

CREATE INDEX IF NOT EXISTS idx_portfolio_images_stylist_sort
  ON public.portfolio_images(stylist_id, sort_order);

-- stylists: surface fields used by Studio
ALTER TABLE public.stylists
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS specialties text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS travels boolean NOT NULL DEFAULT false;

-- weekly availability
CREATE TABLE IF NOT EXISTS public.stylist_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id uuid NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);
CREATE INDEX IF NOT EXISTS idx_avail_stylist ON public.stylist_availability(stylist_id, weekday);

ALTER TABLE public.stylist_availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Availability viewable by everyone" ON public.stylist_availability;
CREATE POLICY "Availability viewable by everyone" ON public.stylist_availability
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Stylists manage own availability" ON public.stylist_availability;
CREATE POLICY "Stylists manage own availability" ON public.stylist_availability
  FOR ALL USING (EXISTS (SELECT 1 FROM public.stylists s WHERE s.id = stylist_availability.stylist_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stylists s WHERE s.id = stylist_availability.stylist_id AND s.user_id = auth.uid()));

-- date-specific overrides (holidays, custom hours)
CREATE TABLE IF NOT EXISTS public.stylist_schedule_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stylist_id uuid NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_closed boolean NOT NULL DEFAULT false,
  start_time time,
  end_time time,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stylist_id, date)
);
ALTER TABLE public.stylist_schedule_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Overrides viewable by everyone" ON public.stylist_schedule_overrides;
CREATE POLICY "Overrides viewable by everyone" ON public.stylist_schedule_overrides
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Stylists manage own overrides" ON public.stylist_schedule_overrides;
CREATE POLICY "Stylists manage own overrides" ON public.stylist_schedule_overrides
  FOR ALL USING (EXISTS (SELECT 1 FROM public.stylists s WHERE s.id = stylist_schedule_overrides.stylist_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stylists s WHERE s.id = stylist_schedule_overrides.stylist_id AND s.user_id = auth.uid()));

-- per-stylist policies
CREATE TABLE IF NOT EXISTS public.stylist_policies (
  stylist_id uuid PRIMARY KEY REFERENCES public.stylists(id) ON DELETE CASCADE,
  cancellation_hours integer NOT NULL DEFAULT 24,
  late_grace_min integer NOT NULL DEFAULT 15,
  no_show_fee_percent integer NOT NULL DEFAULT 50,
  deposit_refundable boolean NOT NULL DEFAULT false,
  custom_terms text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stylist_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Policies viewable by everyone" ON public.stylist_policies;
CREATE POLICY "Policies viewable by everyone" ON public.stylist_policies
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Stylists manage own policies" ON public.stylist_policies;
CREATE POLICY "Stylists manage own policies" ON public.stylist_policies
  FOR ALL USING (EXISTS (SELECT 1 FROM public.stylists s WHERE s.id = stylist_policies.stylist_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stylists s WHERE s.id = stylist_policies.stylist_id AND s.user_id = auth.uid()));

CREATE TRIGGER update_stylist_policies_updated_at
  BEFORE UPDATE ON public.stylist_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();