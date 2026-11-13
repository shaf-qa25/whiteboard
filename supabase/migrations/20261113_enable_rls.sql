-- ========================================================================
-- MIGRATION: 20261113_enable_rls.sql (PRODUCTION-HARDENED VERSION)
-- DESCRIPTION: 
--   1. Enables Row Level Security (RLS) on public."drawing-rooms".
--   2. Dynamically drops ALL existing policies to eliminate permissive overrides.
--   3. Enforces row-level SELECT, INSERT, UPDATE, DELETE security.
--   4. Validates bcrypt hashes on INSERT and UPDATE (strictly rejects plaintext).
--   5. Implements Column-Level Security (CLS): Revokes SELECT on the "password"
--      column from public/anon/authenticated roles, ensuring password hashes
--      are NEVER returned to client-side queries.
--   6. Protects system-owned rooms and prevents room ownership tampering.
--   7. Creates public.rooms_safe view for convenient safe reads.
-- ========================================================================

-- 1. Enable Row Level Security on drawing-rooms table
ALTER TABLE public."drawing-rooms" ENABLE ROW LEVEL SECURITY;

-- 2. Dynamically drop ALL existing policies on "drawing-rooms" to eliminate any legacy permissive rules
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'drawing-rooms'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public."drawing-rooms"', pol.policyname);
  END LOOP;
END $$;

-- 3. SELECT Policy: Anyone (anon, guests, users) can read PUBLIC rooms
CREATE POLICY "Allow read public rooms" ON public."drawing-rooms"
FOR SELECT
USING ("isPublic" = true);

-- 4. SELECT Policy: Authenticated room owners can read their own rooms (public or private)
CREATE POLICY "Allow owners to read own rooms" ON public."drawing-rooms"
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid()::text = owner);

-- 5. INSERT Policy: Restrict creation to authenticated owner or guest; enforce bcrypt or NULL password
CREATE POLICY "Allow room creation" ON public."drawing-rooms"
FOR INSERT
WITH CHECK (
  owner != 'system'
  AND (
    (auth.uid() IS NOT NULL AND auth.uid()::text = owner)
    OR (auth.uid() IS NULL AND owner LIKE 'guest_%')
  )
  AND ("password" IS NULL OR "password" ~ '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$')
);

-- 6. UPDATE Policy: Only authenticated owner can update; blocks plaintext passwords & prevents owner hijacking
CREATE POLICY "Allow owner to update room" ON public."drawing-rooms"
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND auth.uid()::text = owner
  AND owner != 'system'
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid()::text = owner
  AND owner != 'system'
  AND ("password" IS NULL OR "password" ~ '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$')
);

-- 7. DELETE Policy: Only authenticated owner can delete their own rooms; system rooms strictly protected
CREATE POLICY "Allow owner to delete room" ON public."drawing-rooms"
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND auth.uid()::text = owner
  AND owner != 'system'
);

-- 8. Column-Level Security (CLS):
-- Revoke SELECT on the table from anon & authenticated roles, then grant SELECT only on safe columns.
-- The password hash column is NEVER readable by client queries. Server admin (service_role) retains full access.
REVOKE SELECT ON TABLE public."drawing-rooms" FROM anon, authenticated;
GRANT SELECT (id, name, owner, "isPublic", "isPasswordProtected", drawing, created_at, updated_at) 
  ON TABLE public."drawing-rooms" TO anon, authenticated;

-- Allow client INSERT and UPDATE on permitted columns (still filtered by RLS policies above)
GRANT INSERT (id, name, owner, "isPublic", "isPasswordProtected", password, drawing, created_at, updated_at) 
  ON TABLE public."drawing-rooms" TO anon, authenticated;
GRANT UPDATE (name, "isPublic", "isPasswordProtected", password, drawing, updated_at) 
  ON TABLE public."drawing-rooms" TO authenticated;
GRANT DELETE ON TABLE public."drawing-rooms" TO authenticated;

-- 9. Safe Public View (Excludes password column completely)
CREATE OR REPLACE VIEW public.rooms_safe AS
SELECT 
  id,
  name,
  owner,
  "isPublic",
  "isPasswordProtected",
  drawing,
  created_at,
  updated_at
FROM public."drawing-rooms";

-- Grant read access on safe view
GRANT SELECT ON public.rooms_safe TO anon, authenticated;
