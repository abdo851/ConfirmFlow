-- Confirma M4-C — Meta credential verification state
-- Extends meta_connections with verification metadata.
-- Does NOT create conversion event or delivery tables.

ALTER TABLE public.meta_connections
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (
      verification_status IN (
        'unverified',
        'verified',
        'credentials_valid',
        'identifier_not_verified',
        'failed'
      )
    );

ALTER TABLE public.meta_connections
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_meta_connections_verification_status
  ON public.meta_connections(verification_status);
