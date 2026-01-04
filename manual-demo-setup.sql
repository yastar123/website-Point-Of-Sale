-- MANUAL DEMO ACCOUNT SETUP
-- Run this script in Supabase Dashboard > Database > SQL Editor

-- Step 1: Create demo users using auth.admin functions
-- Note: This requires service role privileges

-- Create designer account
SELECT auth.admin.create_user(
  email := 'designer@demo.com',
  password := 'demo123',
  email_confirm := true,
  user_data := '{"full_name": "Demo Designer"}'
);

-- Create cashier account  
SELECT auth.admin.create_user(
  email := 'cashier@demo.com',
  password := 'demo123',
  email_confirm := true,
  user_data := '{"full_name": "Demo Kasir"}'
);

-- Create operator account
SELECT auth.admin.create_user(
  email := 'operator@demo.com',
  password := 'demo123',
  email_confirm := true,
  user_data := '{"full_name": "Demo Operator"}'
);

-- Step 2: Assign roles to users
-- This will be done after users are created

-- Assign designer role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'designer'::app_role
FROM auth.users
WHERE email = 'designer@demo.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign cashier role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'cashier'::app_role
FROM auth.users
WHERE email = 'cashier@demo.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign operator role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'operator'::app_role
FROM auth.users
WHERE email = 'operator@demo.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Verify users
SELECT 
  u.email,
  u.created_at,
  ur.role,
  u.raw_user_meta_data
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email IN ('designer@demo.com', 'cashier@demo.com', 'operator@demo.com')
ORDER BY u.email;
