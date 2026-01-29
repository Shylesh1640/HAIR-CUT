-- MASTER CLEAN SLATE SCHEMA
-- Run this in your Supabase SQL Editor to reset the database and add dummy data.

-- 1. Drop EVERYTHING with CASCADE to ensure a clean start
DROP TRIGGER IF EXISTS users_updated_at ON public.users CASCADE;
DROP FUNCTION IF EXISTS handle_updated_at CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.invoice_items CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.business_settings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Create Users Table (Independent of Supabase Auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  password TEXT NOT NULL, -- Plain text for this demo/local setup
  role TEXT CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
  employee_id TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Trigger for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- 4. Create Core Application Tables
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('present', 'absent', 'half_day')) DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  min_price DECIMAL(10,2) DEFAULT 0,
  max_price DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone_number TEXT UNIQUE NOT NULL,
  email TEXT,
  total_visits INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_visit_date DATE,
  customer_type TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  subtotal DECIMAL(10,2) DEFAULT 0,
  gst_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  is_gst_invoice BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_type TEXT,
  item_id UUID,
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) DEFAULT 0
);

-- Add missing column to invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS gst_percentage DECIMAL(5,2) DEFAULT 18;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;

-- Expenses Table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT CHECK (category IN ('rent', 'salary', 'electricity', 'supplies', 'maintenance', 'other')) DEFAULT 'other',
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  expense_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Business Settings Table (Single Row)
CREATE TABLE public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  gst_number TEXT DEFAULT '',
  default_gst_percentage DECIMAL(5,2) DEFAULT 18,
  logo_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payments Table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer')) DEFAULT 'cash',
  amount DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. DISABLE RLS for ALL TABLES (As requested to keep it simple)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;

-- 6. SEED DUMMY DATA
-- DUMMY ADMIN
INSERT INTO public.users (email, password, full_name, role, employee_id)
VALUES ('admin@salon.com', 'admin123', 'Project Admin', 'admin', 'ADM001');

-- DUMMY EMPLOYEE
INSERT INTO public.users (email, password, full_name, role, employee_id)
VALUES ('employee@salon.com', 'employee123', 'Salon Staff', 'employee', 'EMP001');

-- SAMPLE SERVICES
INSERT INTO public.services (name, description, min_price, max_price)
VALUES 
('Hair Cut', 'Standard styling', 500, 1000),
('Hair Wash', 'Smoothing wash', 200, 500),
('Facial', 'Deep skin cleaning', 1200, 3000);

-- SAMPLE PRODUCTS
INSERT INTO public.products (name, price, stock_quantity)
VALUES 
('Shampoo 500ml', 450, 20),
('Conditioner 500ml', 550, 15),
('Hair Gel', 250, 30);

-- DEFAULT BUSINESS SETTINGS
INSERT INTO public.business_settings (business_name, phone, email, address, gst_number, default_gst_percentage)
VALUES ('My Salon', '+91 98765 43210', 'salon@example.com', '123 Main Street, City', '29ABCDE1234F1Z5', 18);

-- SAMPLE EXPENSE
INSERT INTO public.expenses (category, amount, description, expense_date)
VALUES ('rent', 15000, 'Shop Rent - January', CURRENT_DATE - 15);

