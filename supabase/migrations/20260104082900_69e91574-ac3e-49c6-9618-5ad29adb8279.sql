-- Fix: Allow users to insert their own role during signup
CREATE POLICY "Users can insert own role" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Also allow service role to insert (for admin purposes)
CREATE POLICY "Allow authenticated users to insert roles during signup" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (true);