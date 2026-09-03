-- Run this in your Supabase SQL Editor to allow all authenticated users (like supervisors) to read user profiles (like worker names)
CREATE POLICY "Allow authenticated to read users_profile" ON public.users_profile FOR SELECT TO authenticated USING (true);
