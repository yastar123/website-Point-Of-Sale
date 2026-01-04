-- FIX RLS POLICIES FOR ORDERS TABLE
-- Run this in Supabase Dashboard > Database > SQL Editor

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Designers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders;

-- Create new policies with better logic
CREATE POLICY "Users can view orders" ON public.orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Designers can create orders" ON public.orders
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'designer'
    )
  );

CREATE POLICY "Users can update orders" ON public.orders
  FOR UPDATE TO authenticated USING (true);

-- Also fix order_items policies
DROP POLICY IF EXISTS "Designers can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can view order items" ON public.order_items;

CREATE POLICY "Users can view order items" ON public.order_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Designers can create order items" ON public.order_items
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'designer'
    )
  );

-- Fix user_roles policies to be more permissive
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to insert roles during signup" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Users can view roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (true);

-- Verify current user roles
SELECT 
  u.email,
  ur.role,
  u.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email IN ('designer@demo.com', 'cashier@demo.com', 'operator@demo.com')
ORDER BY u.email;
