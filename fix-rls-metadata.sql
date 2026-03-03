-- =================================================================
-- Script de Seguridad GLOBAL: Corrección de RLS (Metadata Segura)
-- =================================================================
-- Este script corrige la vulnerabilidad de 'user_metadata' en TODAS
-- las tablas del sistema CodiaTax.
-- Versión Idempotente: Elimina las políticas antes de crearlas.
-- =================================================================

-- 1. TABLA: driver_profiles
DROP POLICY IF EXISTS "Drivers can handle their own profile" ON public.driver_profiles;
CREATE POLICY "Drivers can handle their own profile" 
ON public.driver_profiles FOR ALL 
USING (lower(user_id) = lower((auth.jwt() -> 'app_metadata' ->> 'name')::text));

-- 2. TABLA: invoices
DROP POLICY IF EXISTS "Drivers can handle their own invoices" ON public.invoices;
CREATE POLICY "Drivers can handle their own invoices" 
ON public.invoices FOR ALL 
USING (lower(user_id) = lower((auth.jwt() -> 'app_metadata' ->> 'name')::text));

-- 3. TABLA: abonados
DROP POLICY IF EXISTS "Acceso total abonados" ON abonados;
DROP POLICY IF EXISTS "Dueño ve abonados" ON abonados;
DROP POLICY IF EXISTS "Dueño crea abonados" ON abonados;
DROP POLICY IF EXISTS "Dueño edita abonados" ON abonados;
DROP POLICY IF EXISTS "Dueño borra abonados" ON abonados;
CREATE POLICY "Acceso total abonados" ON abonados FOR ALL 
USING (lower(user_id) = lower((auth.jwt() -> 'app_metadata' ->> 'name')::text));

-- 4. TABLA: servicios
DROP POLICY IF EXISTS "Acceso total servicios" ON servicios;
DROP POLICY IF EXISTS "Dueño ve servicios" ON servicios;
DROP POLICY IF EXISTS "Dueño crea servicios" ON servicios;
DROP POLICY IF EXISTS "Dueño edita servicios" ON servicios;
DROP POLICY IF EXISTS "Dueño borra servicios" ON servicios;
CREATE POLICY "Acceso total servicios" ON servicios FOR ALL 
USING (lower(user_id) = lower((auth.jwt() -> 'app_metadata' ->> 'name')::text));

-- 5. TABLA: gastos
DROP POLICY IF EXISTS "Acceso total gastos" ON gastos;
DROP POLICY IF EXISTS "Dueño ve gastos" ON gastos;
DROP POLICY IF EXISTS "Dueño crea gastos" ON gastos;
DROP POLICY IF EXISTS "Dueño edita gastos" ON gastos;
DROP POLICY IF EXISTS "Dueño borra gastos" ON gastos;
CREATE POLICY "Acceso total gastos" ON gastos FOR ALL 
USING (lower(user_id) = lower((auth.jwt() -> 'app_metadata' ->> 'name')::text));

-- 6. TABLA: vehiculos
DROP POLICY IF EXISTS "Acceso total vehiculos" ON vehiculos;
DROP POLICY IF EXISTS "Dueño ve vehiculos" ON vehiculos;
DROP POLICY IF EXISTS "Dueño crea vehiculos" ON vehiculos;
DROP POLICY IF EXISTS "Dueño edita vehiculos" ON vehiculos;
CREATE POLICY "Acceso total vehiculos" ON vehiculos FOR ALL 
USING (lower(user_id) = lower((auth.jwt() -> 'app_metadata' ->> 'name')::text));

-- 7. TABLA: turnos_storage
DROP POLICY IF EXISTS "Acceso total turnos" ON turnos_storage;
DROP POLICY IF EXISTS "Dueño ve turnos" ON turnos_storage;
DROP POLICY IF EXISTS "Dueño crea turnos" ON turnos_storage;
DROP POLICY IF EXISTS "Dueño edita turnos" ON turnos_storage;
CREATE POLICY "Acceso total turnos" ON turnos_storage FOR ALL 
USING (lower(user_id) = lower((auth.jwt() -> 'app_metadata' ->> 'name')::text));

-- =================================================================
-- NOTA FINAL: Asegúrate de que el campo 'name' esté en 'app_metadata'
-- para todos los usuarios en el panel de Supabase Auth.
-- =================================================================
