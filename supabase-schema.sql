-- =====================================================
-- VASASALUD - SUPABASE DATABASE SCHEMA
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- ===== 1. PROFILES TABLE =====
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  dni TEXT,
  birthdate DATE,
  obra_social TEXT,
  plan TEXT,
  nro_afiliado TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for role queries
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- ===== 2. REQUESTS TABLE =====
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('receta', 'orden', 'transcripcion')),
  title TEXT,
  details JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'responded')),
  admin_response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS requests_user_id_idx ON public.requests(user_id);
CREATE INDEX IF NOT EXISTS requests_status_idx ON public.requests(status);
CREATE INDEX IF NOT EXISTS requests_created_at_idx ON public.requests(created_at DESC);

-- ===== 3. FAMILY MEMBERS TABLE =====
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dni TEXT,
  age INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS family_members_user_id_idx ON public.family_members(user_id);

-- ===== 4. UPDATED_AT TRIGGER =====
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER requests_updated_at
  BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===== 5. AUTO-CREATE PROFILE ON SIGNUP =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- ===== PROFILES RLS =====

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (not role)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Admins and super_admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Only super_admins can update any profile
CREATE POLICY "Super admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Super admins can delete profiles
CREATE POLICY "Super admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ===== REQUESTS RLS =====

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON public.requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create own requests"
  ON public.requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
  ON public.requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can update requests (respond)
CREATE POLICY "Admins can respond to requests"
  ON public.requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ===== FAMILY MEMBERS RLS =====

-- Users can manage their own family members
CREATE POLICY "Users can view own family"
  ON public.family_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own family"
  ON public.family_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own family"
  ON public.family_members FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all family members
CREATE POLICY "Admins can view all family members"
  ON public.family_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- STORAGE BUCKET FOR TRANSCRIPTIONS
-- =====================================================

-- Create storage bucket (run this in Supabase Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('vasasalud', 'vasasalud', true);

-- Storage policies (execute in SQL Editor)
-- CREATE POLICY "Authenticated users can upload"
--   ON storage.objects FOR INSERT
--   WITH CHECK (auth.role() = 'authenticated' AND bucket_id = 'vasasalud');

-- CREATE POLICY "Public read access"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'vasasalud');

-- =====================================================
-- INITIAL SUPER ADMIN (optional - set manually after first signup)
-- UPDATE public.profiles SET role = 'super_admin' WHERE email = 'superadmin@vasasalud.com';
-- =====================================================
