-- Admin roles, CMS content blocks, provider waitlist, and policy settings.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin', 'owner'));

CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.role() = 'authenticated' THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_role_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_escalation();

CREATE TABLE IF NOT EXISTS public.content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('banner', 'video', 'ad', 'text')),
  title TEXT,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  cta_label TEXT,
  cta_url TEXT,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  locale TEXT NOT NULL DEFAULT 'both' CHECK (locale IN ('both', 'ar', 'en')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_blocks_position ON public.content_blocks(position);
CREATE INDEX IF NOT EXISTS idx_content_blocks_type ON public.content_blocks(type);
CREATE INDEX IF NOT EXISTS idx_content_blocks_is_active ON public.content_blocks(is_active);

DROP TRIGGER IF EXISTS content_blocks_set_updated_at ON public.content_blocks;
CREATE TRIGGER content_blocks_set_updated_at
  BEFORE UPDATE ON public.content_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_blocks_select_authenticated ON public.content_blocks;
CREATE POLICY content_blocks_select_authenticated
  ON public.content_blocks
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS content_blocks_insert_admin ON public.content_blocks;
CREATE POLICY content_blocks_insert_admin
  ON public.content_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS content_blocks_update_admin ON public.content_blocks;
CREATE POLICY content_blocks_update_admin
  ON public.content_blocks
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

DROP POLICY IF EXISTS content_blocks_delete_admin ON public.content_blocks;
CREATE POLICY content_blocks_delete_admin
  ON public.content_blocks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('youcan', 'shopify')),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT waitlist_provider_email_unique UNIQUE (provider, email)
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS waitlist_insert_authenticated ON public.waitlist;
CREATE POLICY waitlist_insert_authenticated
  ON public.waitlist
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS waitlist_select_admin ON public.waitlist;
CREATE POLICY waitlist_select_admin
  ON public.waitlist
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS app_settings_set_updated_at ON public.app_settings;
CREATE TRIGGER app_settings_set_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.app_settings (key, value)
VALUES ('policies', '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_settings_select_public ON public.app_settings;
CREATE POLICY app_settings_select_public
  ON public.app_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS app_settings_update_admin ON public.app_settings;
CREATE POLICY app_settings_update_admin
  ON public.app_settings
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_blocks TO authenticated;
GRANT SELECT, INSERT ON public.waitlist TO authenticated;
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT UPDATE ON public.app_settings TO authenticated;

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'test@confirma.local';
