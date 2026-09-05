-- ============================================================
-- Phase Club 1: RLS Policies for public.club_requests
-- Run this in your Supabase SQL editor or as a migration
-- ============================================================

-- 1. Enable RLS on club_requests (if not already enabled)
ALTER TABLE public.club_requests ENABLE ROW LEVEL SECURITY;

-- 2. Allow anyone (anon or authenticated) to INSERT a club request
--    Needed because the form is accessed without a Supabase auth session.
CREATE POLICY "Anyone can submit a club request"
  ON public.club_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 3. Allow anyone to SELECT club_requests (needed for duplicate email check on form + admin list)
--    Admin role filtering is enforced in application code via the profiles role check.
CREATE POLICY "Allow read access to club requests"
  ON public.club_requests
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 4. Allow authenticated admin users to UPDATE club requests (approve/reject)
CREATE POLICY "Admins can update club request status"
  ON public.club_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('super_admin', 'founder', 'moderator', 'junior_moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('super_admin', 'founder', 'moderator', 'junior_moderator')
    )
  );

-- 5. Allow DELETE on rejected records (for resubmission flow)
CREATE POLICY "Allow delete of rejected club requests"
  ON public.club_requests
  FOR DELETE
  TO anon, authenticated
  USING (status = 'rejected');
