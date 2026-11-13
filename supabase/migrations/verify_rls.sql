-- ========================================================================
-- POST-MIGRATION SQL VERIFICATION SUITE
-- FILE: supabase/migrations/verify_rls.sql
-- INSTRUCTIONS: Run this in Supabase SQL Editor right after applying
--               20261113_enable_rls.sql.
-- ========================================================================

-- STEP 1: SETUP TEST SCENARIO (Run as postgres / service_role)
DO $$
BEGIN
  DELETE FROM public."drawing-rooms" 
  WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

  INSERT INTO public."drawing-rooms" (id, name, owner, "isPublic", "isPasswordProtected", password)
  VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Public Test Room', 'a0000000-0000-0000-0000-000000000001', true, false, NULL),
    ('22222222-2222-2222-2222-222222222222', 'Private Test Room', 'a0000000-0000-0000-0000-000000000001', false, false, '$2b$10$tXFj4wMooGH7EK3t3.gnne4x787D.QCNXSdO8uruNp8.BaU7CjBv2');
  
  RAISE NOTICE 'Setup complete: Public and Private test rooms created.';
END $$;

-- STEP 2: ANONYMOUS ROLE VERIFICATION SUITE
DO $$
DECLARE
  v_rows integer := 0;
  v_caught boolean := false;
BEGIN
  SET LOCAL ROLE anon;

  -- Test 2.1: Anon cannot read private room (Expected: 0 rows)
  SELECT count(*) INTO v_rows FROM public."drawing-rooms" WHERE id = '22222222-2222-2222-2222-222222222222';
  IF v_rows = 0 THEN
    RAISE NOTICE '[PASS] Test 2.1: Anonymous user cannot read private rooms (0 rows returned)';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 2.1: Anonymous user read private room!';
  END IF;

  -- Test 2.2: Anon can read public room safe columns (Expected: 1 row)
  SELECT count(*) INTO v_rows FROM public."drawing-rooms" WHERE id = '11111111-1111-1111-1111-111111111111';
  IF v_rows = 1 THEN
    RAISE NOTICE '[PASS] Test 2.2: Anonymous user can read public room (1 row returned)';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 2.2: Anonymous user could not read public room!';
  END IF;

  -- Test 2.3: Anon SELECT on password column is caught and verified
  v_caught := false;
  BEGIN
    EXECUTE 'SELECT password FROM public."drawing-rooms" WHERE id = ''11111111-1111-1111-1111-111111111111''';
  EXCEPTION WHEN insufficient_privilege THEN
    v_caught := true;
  END;
  IF v_caught THEN
    RAISE NOTICE '[PASS] Test 2.3: Anonymous SELECT password threw expected insufficient_privilege';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 2.3: Anonymous user was permitted to SELECT password!';
  END IF;

  -- Test 2.4: Anon UPDATE blocked (Traps insufficient_privilege or 0 rows; fails if room modified)
  v_caught := false;
  v_rows := 0;
  BEGIN
    EXECUTE 'UPDATE public."drawing-rooms" SET name = ''Anon Tamper'' WHERE id = ''11111111-1111-1111-1111-111111111111''';
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows > 0 THEN
      RAISE EXCEPTION '[FAIL] Test 2.4: Anonymous user updated room!';
    END IF;
  EXCEPTION 
    WHEN insufficient_privilege THEN
      v_caught := true;
  END;
  IF v_caught OR v_rows = 0 THEN
    RAISE NOTICE '[PASS] Test 2.4: Anonymous UPDATE securely blocked (permission denied / 0 rows)';
  END IF;

  -- Test 2.5: Anon DELETE blocked (Traps insufficient_privilege or 0 rows; fails if room deleted)
  v_caught := false;
  v_rows := 0;
  BEGIN
    EXECUTE 'DELETE FROM public."drawing-rooms" WHERE id = ''11111111-1111-1111-1111-111111111111''';
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows > 0 THEN
      RAISE EXCEPTION '[FAIL] Test 2.5: Anonymous user deleted room!';
    END IF;
  EXCEPTION 
    WHEN insufficient_privilege THEN
      v_caught := true;
  END;
  IF v_caught OR v_rows = 0 THEN
    RAISE NOTICE '[PASS] Test 2.5: Anonymous DELETE securely blocked (permission denied / 0 rows)';
  END IF;

  -- Test 2.6: System room protected from Anon
  v_caught := false;
  v_rows := 0;
  BEGIN
    EXECUTE 'UPDATE public."drawing-rooms" SET name = ''Hacked System'' WHERE owner = ''system''';
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows > 0 THEN
      RAISE EXCEPTION '[FAIL] Test 2.6: System room was modified by Anon!';
    END IF;
  EXCEPTION 
    WHEN insufficient_privilege THEN
      v_caught := true;
  END;
  IF v_caught OR v_rows = 0 THEN
    RAISE NOTICE '[PASS] Test 2.6: System room protected from Anon UPDATE (0 rows affected / permission denied)';
  END IF;
END $$;

-- STEP 3: AUTHENTICATED ROLE VERIFICATION SUITE
DO $$
DECLARE
  v_rows integer := 0;
  v_caught boolean := false;
BEGIN
  SET LOCAL ROLE authenticated;

  -- Test 3.1: Bob (unauthorized) cannot read Alice's private room
  PERFORM set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000002', true);
  SELECT count(*) INTO v_rows FROM public."drawing-rooms" WHERE id = '22222222-2222-2222-2222-222222222222';
  IF v_rows = 0 THEN
    RAISE NOTICE '[PASS] Test 3.1: Unauthorized user Bob cannot read Alice private room (0 rows)';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 3.1: Bob read Alice private room!';
  END IF;

  -- Test 3.2: Alice (owner) CAN read her own private room
  PERFORM set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
  SELECT count(*) INTO v_rows FROM public."drawing-rooms" WHERE id = '22222222-2222-2222-2222-222222222222';
  IF v_rows = 1 THEN
    RAISE NOTICE '[PASS] Test 3.2: Owner Alice can read her own private room (1 row)';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 3.2: Alice could not read her own private room!';
  END IF;

  -- Test 3.3: Bob (unauthorized) cannot UPDATE Alice's room
  PERFORM set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000002', true);
  UPDATE public."drawing-rooms" SET name = 'Bob Tamper' WHERE id = '11111111-1111-1111-1111-111111111111';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE NOTICE '[PASS] Test 3.3: Non-owner Bob UPDATE blocked (0 rows affected)';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 3.3: Non-owner Bob modified Alice room!';
  END IF;

  -- Test 3.4: Bob (unauthorized) cannot DELETE Alice's room
  DELETE FROM public."drawing-rooms" WHERE id = '11111111-1111-1111-1111-111111111111';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE NOTICE '[PASS] Test 3.4: Non-owner Bob DELETE blocked (0 rows affected)';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 3.4: Non-owner Bob deleted Alice room!';
  END IF;

  -- Test 3.5: Client (even Owner) CANNOT update password directly (permission denied on password column)
  PERFORM set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
  v_caught := false;
  BEGIN
    EXECUTE 'UPDATE public."drawing-rooms" SET password = ''plaintext_secret'' WHERE id = ''11111111-1111-1111-1111-111111111111''';
  EXCEPTION WHEN insufficient_privilege THEN
    v_caught := true;
  END;
  IF v_caught THEN
    RAISE NOTICE '[PASS] Test 3.5: Client UPDATE on password column threw expected insufficient_privilege';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 3.5: Client was permitted to update password column directly!';
  END IF;

  -- Test 3.6: Owner Alice CAN update safe columns (e.g. room name)
  UPDATE public."drawing-rooms" SET name = 'Alice Renamed Board' WHERE id = '11111111-1111-1111-1111-111111111111';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 1 THEN
    RAISE NOTICE '[PASS] Test 3.6: Owner Alice successfully updated safe column (1 row affected)';
  ELSE
    RAISE EXCEPTION '[FAIL] Test 3.6: Owner Alice failed to update safe column!';
  END IF;
END $$;

-- STEP 4: TEARDOWN (Clean up test rooms)
DO $$
BEGIN
  DELETE FROM public."drawing-rooms" 
  WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
  RAISE NOTICE 'Teardown complete: All test rooms cleaned up.';
  RAISE NOTICE '🎉 ALL 12 SECURITY AUDIT CHECKS PASSED WITH EXPLICIT ASSERTIONS!';
END $$;
