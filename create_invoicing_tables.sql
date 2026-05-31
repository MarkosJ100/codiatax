-- Tablas para el sistema de facturación (CodiaTax)
-- Arreglo de RLS para compatibilidad con nombres de usuario (marcos, etc.)

-- 1. Perfiles de Conductor
CREATE TABLE IF NOT EXISTS public.driver_profiles (
    user_id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    dni TEXT,
    nif TEXT,
    address TEXT,
    license_no TEXT,
    municipality TEXT,
    phone TEXT,
    email TEXT,
    regime TEXT DEFAULT 'Autónomo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Facturas
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.driver_profiles(user_id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    series TEXT,
    date_emission DATE NOT NULL,
    date_service DATE NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    time_start TEXT,
    time_end TEXT,
    km DECIMAL,
    base_amount DECIMAL NOT NULL,
    iva_rate DECIMAL DEFAULT 10,
    iva_amount DECIMAL NOT NULL,
    total_amount DECIMAL NOT NULL,
    payment_method TEXT DEFAULT 'Efectivo',
    client_name TEXT NOT NULL,
    client_nif TEXT,
    client_address TEXT,
    client_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- ELIMINAR POLÍTICAS ANTIGUAS (si existen)
DROP POLICY IF EXISTS "Drivers can view their own profile" ON public.driver_profiles;
DROP POLICY IF EXISTS "Drivers can update their own profile" ON public.driver_profiles;
DROP POLICY IF EXISTS "Drivers can handle their own invoices" ON public.invoices;

-- NUEVAS POLÍTICAS COMPATIBLES CON CODIATAX
-- Estas políticas comparan el campo 'name' de los metadatos de Supabase Auth
-- con el user_id (nombre normalizado como 'marcos') de las tablas.

CREATE POLICY "Drivers can handle their own profile" 
ON public.driver_profiles FOR ALL 
USING (lower(user_id) = lower((auth.jwt() -> 'user_metadata' ->> 'name')::text));

CREATE POLICY "Drivers can handle their own invoices" 
ON public.invoices FOR ALL 
USING (lower(user_id) = lower((auth.jwt() -> 'user_metadata' ->> 'name')::text));
