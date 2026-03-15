
-- Add new columns to stylists table
ALTER TABLE public.stylists 
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS buffer_minutes integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS transport_fee integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_percentage integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS home_service_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_bookings_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS early_program boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS early_program_start timestamp with time zone;

-- Add location columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

-- Add service_images to services
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- Add platform_fee column to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS platform_fee integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_amount integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_balance integer NOT NULL DEFAULT 0;

-- Function to check booking conflicts (prevents double booking)
CREATE OR REPLACE FUNCTION public.check_booking_conflict(
  p_stylist_id uuid,
  p_date date,
  p_time time,
  p_duration_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  buffer_min integer;
  conflict_exists boolean;
BEGIN
  SELECT COALESCE(buffer_minutes, 30) INTO buffer_min FROM stylists WHERE id = p_stylist_id;
  
  SELECT EXISTS (
    SELECT 1 FROM bookings
    WHERE stylist_id = p_stylist_id
      AND appointment_date = p_date
      AND status IN ('pending', 'accepted', 'confirmed')
      AND (
        appointment_time BETWEEN (p_time - (p_duration_minutes + buffer_min) * interval '1 minute')
        AND (p_time + (p_duration_minutes + buffer_min) * interval '1 minute')
      )
  ) INTO conflict_exists;
  
  RETURN conflict_exists;
END;
$$;

-- Function to get available time slots for a stylist on a date
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_stylist_id uuid,
  p_date date
)
RETURNS TABLE(time_slot time)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  buffer_min integer;
BEGIN
  SELECT COALESCE(buffer_minutes, 30) INTO buffer_min FROM stylists WHERE id = p_stylist_id;
  
  RETURN QUERY
  SELECT t.slot
  FROM (
    SELECT generate_series('09:00'::time, '17:00'::time, '1 hour'::interval) AS slot
  ) t
  WHERE NOT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.stylist_id = p_stylist_id
      AND b.appointment_date = p_date
      AND b.status IN ('pending', 'accepted', 'confirmed')
      AND b.appointment_time BETWEEN (t.slot - (60 + buffer_min) * interval '1 minute')
                                    AND (t.slot + (60 + buffer_min) * interval '1 minute')
  );
END;
$$;

-- Trigger to update completed_bookings_count when booking status changes
CREATE OR REPLACE FUNCTION public.update_completed_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    UPDATE stylists 
    SET completed_bookings_count = completed_bookings_count + 1
    WHERE id = NEW.stylist_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_completed
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_completed_count();

-- Enable realtime for bookings
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- Portfolio images: add video support
ALTER TABLE public.portfolio_images
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image';

-- RLS: allow stylists to update own profile fields
CREATE POLICY "Stylists can update own stylist record" ON public.stylists
  FOR UPDATE USING (auth.uid() = user_id);
