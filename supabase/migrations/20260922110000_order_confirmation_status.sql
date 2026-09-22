-- Extend order confirmation lifecycle: pending, confirmed, rejected, archived.
-- Does not change store-provider or Meta integration tables.

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_confirmation_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_confirmation_status_check
  CHECK (confirmation_status IN ('pending', 'confirmed', 'rejected', 'archived'));
