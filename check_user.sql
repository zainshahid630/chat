-- Check if the user exists in auth.users
SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = 'zainshahid630@gmail.com';

-- Check if the user exists in public.users
SELECT * FROM public.users WHERE email = 'zainshahid630@gmail.com';

-- Check if the trigger exists
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Manually create the user profile if it doesn't exist
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  metadata
)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  COALESCE(raw_user_meta_data->>'role', 'customer'),
  COALESCE(raw_user_meta_data, '{}'::jsonb)
FROM auth.users
WHERE email = 'zainshahid630@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Verify the user was created
SELECT * FROM public.users WHERE email = 'zainshahid630@gmail.com';

