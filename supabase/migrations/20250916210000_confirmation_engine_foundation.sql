-- Confirma M3-C — Confirmation engine foundation
-- Extends orders for pending → confirmed merchant confirmation.
-- Does NOT create conversion, Meta, or audit tables.

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_confirmation_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_confirmation_status_check
  CHECK (confirmation_status IN ('pending', 'confirmed'));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_confirmed_at
  ON public.orders(confirmed_at DESC)
  WHERE confirmed_at IS NOT NULL;
