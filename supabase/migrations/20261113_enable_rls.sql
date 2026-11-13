-- ========================================================================
-- MIGRATION: 20261113_enable_rls.sql (FINAL HARDENED VERSION)
-- DESCRIPTION: Enable Row Level Security (RLS) on public."drawing-rooms".
--              - Dynamically removes all legacy policies via pg_policies.
--              - Enforces strict SELECT, INSERT, UPDATE, DELETE permissions.
--              - Validates bcrypt hashes on INSERT and UPDATE (blocks plaintext).
--              - Protects system-owned rooms from client modification/deletion.
--              - Protects room ownership from being transferred.
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

-- 3. SELECT: Anyone (anon, guests, users) can read PUBLIC rooms
CREATE POLICY "Allow read public rooms" ON public."drawing-rooms"
FOR SELECT
USING ("isPublic" = true);

-- 4. SELECT: Authenticated room owners can read their own rooms (public or private)
CREATE POLICY "Allow owners to read own rooms" ON public."drawing-rooms"
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid()::text = owner);

-- 5. INSERT: Restrict creation to authenticated owner or guest; enforce bcrypt or NULL password
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

-- 6. UPDATE: Only authenticated owner can update; blocks plaintext passwords & prevents owner hijacking
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

-- 7. DELETE: Only authenticated owner can delete their own rooms; system rooms strictly protected
CREATE POLICY "Allow owner to delete room" ON public."drawing-rooms"
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND auth.uid()::text = owner
  AND owner != 'system'
);
