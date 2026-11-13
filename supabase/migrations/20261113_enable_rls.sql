-- ========================================================================
-- MIGRATION: 20261113_enable_rls.sql (HARDENED & CORRECTED)
-- DESCRIPTION: Enable Row Level Security (RLS) on public."drawing-rooms"
--              with strict protections against privilege escalation,
--              system room hijacking, and unauthorized mutations.
-- ========================================================================

-- 1. Enable Row Level Security on drawing-rooms table
ALTER TABLE public."drawing-rooms" ENABLE ROW LEVEL SECURITY;

-- 2. Clean up any existing policies
DROP POLICY IF EXISTS "Allow read public rooms" ON public."drawing-rooms";
DROP POLICY IF EXISTS "Allow owners to read own rooms" ON public."drawing-rooms";
DROP POLICY IF EXISTS "Allow room creation" ON public."drawing-rooms";
DROP POLICY IF EXISTS "Allow owner to update room" ON public."drawing-rooms";
DROP POLICY IF EXISTS "Allow owner to delete room" ON public."drawing-rooms";

-- 3. SELECT: Anyone (including anon & guests) can read PUBLIC rooms
CREATE POLICY "Allow read public rooms" ON public."drawing-rooms"
FOR SELECT
USING ("isPublic" = true);

-- 4. SELECT: Authenticated owners can read their own rooms (public or private)
CREATE POLICY "Allow owners to read own rooms" ON public."drawing-rooms"
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid()::text = owner);

-- 5. INSERT: Restrict room creation to valid owners; forbid 'system' spoofing and plaintext passwords
CREATE POLICY "Allow room creation" ON public."drawing-rooms"
FOR INSERT
WITH CHECK (
  owner != 'system'
  AND (
    (auth.uid() IS NOT NULL AND auth.uid()::text = owner)
    OR (auth.uid() IS NULL AND owner LIKE 'guest_%')
  )
  AND ("password" IS NULL OR "password" ~ '^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$')
);

-- 6. UPDATE: Only authenticated room owners can update their rooms (system rooms protected)
CREATE POLICY "Allow owner to update room" ON public."drawing-rooms"
FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid()::text = owner)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid()::text = owner);

-- 7. DELETE: Only authenticated room owners can delete their rooms (system rooms protected)
CREATE POLICY "Allow owner to delete room" ON public."drawing-rooms"
FOR DELETE
USING (auth.uid() IS NOT NULL AND auth.uid()::text = owner);
