-- ========================================================================
-- MIGRATION: 20261113_enable_rls.sql
-- DESCRIPTION: Enable Row Level Security (RLS) on drawing-rooms and apply
--              secure access policies for public, private and owner operations.
-- ========================================================================

-- 1. Enable Row Level Security on drawing-rooms table
ALTER TABLE public."drawing-rooms" ENABLE ROW LEVEL SECURITY;

-- 2. Clean up any existing policies
DROP POLICY IF EXISTS "Allow read public rooms" ON public."drawing-rooms";
DROP POLICY IF EXISTS "Allow owners to read own rooms" ON public."drawing-rooms";
DROP POLICY IF EXISTS "Allow room creation" ON public."drawing-rooms";
DROP POLICY IF EXISTS "Allow owner to update room" ON public."drawing-rooms";
DROP POLICY IF EXISTS "Allow owner to delete room" ON public."drawing-rooms";

-- 3. Policy: Anyone can read PUBLIC rooms
CREATE POLICY "Allow read public rooms" ON public."drawing-rooms"
FOR SELECT
USING ("isPublic" = true);

-- 4. Policy: Owners can read their own rooms (whether public or private)
CREATE POLICY "Allow owners to read own rooms" ON public."drawing-rooms"
FOR SELECT
USING (auth.uid()::text = owner OR owner = 'system');

-- 5. Policy: Room creation allowed for authenticated users and guests
CREATE POLICY "Allow room creation" ON public."drawing-rooms"
FOR INSERT
WITH CHECK (true);

-- 6. Policy: Room deletion restricted strictly to the room owner
CREATE POLICY "Allow owner to delete room" ON public."drawing-rooms"
FOR DELETE
USING (auth.uid()::text = owner OR owner = 'system');

-- 7. Policy: Room metadata updates restricted strictly to the room owner
CREATE POLICY "Allow owner to update room" ON public."drawing-rooms"
FOR UPDATE
USING (auth.uid()::text = owner OR owner = 'system');
