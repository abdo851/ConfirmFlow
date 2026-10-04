-- Platform custom domain recorded by an admin.
-- Does not verify DNS, hosting, or SSL.

CREATE TABLE public.platform_domain_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL CHECK (char_length(domain) > 0),
  status TEXT NOT NULL DEFAULT 'setup_required'
    CHECK (status IN ('setup_required', 'pending_verification', 'connected', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX platform_domain_settings_singleton
  ON public.platform_domain_settings ((TRUE));

CREATE TRIGGER platform_domain_settings_set_updated_at
  BEFORE UPDATE ON public.platform_domain_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.platform_domain_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_domain_settings_select_admin
  ON public.platform_domain_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY platform_domain_settings_insert_admin
  ON public.platform_domain_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY platform_domain_settings_update_admin
  ON public.platform_domain_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY platform_domain_settings_delete_admin
  ON public.platform_domain_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'owner')
    )
  );

REVOKE ALL ON TABLE public.platform_domain_settings FROM PUBLIC;
REVOKE ALL ON TABLE public.platform_domain_settings FROM anon;
REVOKE ALL ON TABLE public.platform_domain_settings FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.platform_domain_settings TO authenticated;
