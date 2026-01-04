-- ASSIGN ROLES TO DEMO USERS
-- Run this in Supabase Dashboard > Database > SQL Editor

-- Assign designer role to designer@demo.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'designer'::app_role
FROM auth.users
WHERE email = 'designer@demo.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign cashier role to cashier@demo.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'cashier'::app_role
FROM auth.users
WHERE email = 'cashier@demo.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign operator role to operator@demo.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'operator'::app_role
FROM auth.users
WHERE email = 'operator@demo.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the assignments
SELECT 
  u.email,
  u.created_at,
  ur.role,
  u.raw_user_meta_data
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email IN ('designer@demo.com', 'cashier@demo.com', 'operator@demo.com')
ORDER BY u.email;
