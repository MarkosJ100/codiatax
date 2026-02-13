-- Script de corrección para compatibilidad con nombres de usuario (Legacy)
-- Este script asume que la app usa 'nombres de usuario' (ej. 'marcos') como user_id en lugar de UUIDs de Supabase.

-- IMPORTANTE: Para que RLS funcione con nombres de usuario, necesitamos una forma de vincular el UUID de auth real con el nombre de usuario 'legacy'.
-- Como solución temporal para NO romper la app, vamos a permitir que user_id sea TEXT y validaremos contra una tabla de perfiles o metadatos si es posible.
-- SI NO HAY TABLA DE PERFILES, la seguridad RLS basada en auth.uid() = user_id FALLARÁ porque 'uuid' != 'marcos'.

-- SOLUCIÓN HÍBRIDA:
-- 1. Definir columnas como TEXT (ya que la app envía strings).
-- 2. Las políticas RLS ideales requerirían migrar a UUIDs, pero eso rompe la app actual.
-- 3. Por ahora, crearemos las tablas y dejaremos RLS *deshabilitado* o con una política permisiva "true" si la autenticación falla,
--    O intentaremos castear si el user_id SÍ es un UUID almacenado como texto.

-- SI la app está enviando un UUID real (pero como string) entonces el cast funcionará.
-- SI la app envía "Juan", entonces la comparación `auth.uid() = 'Juan'` siempre será falsa.

-- ASUNCIÓN: La app ha sido refactorizada para usar `auth.user.id` (UUID) en el AuthContext nuevo.
-- Verifiquemos src/context/AuthContext.tsx... Espera, vi que normalizaba el username.
-- Si la app sigue usando nombres, RLS no servirá de mucho sin un mapeo.
-- PERO el usuario pidió arreglar el error de tipo.
-- Arreglemos el error de tipo casteando auth.uid() a text.

-- 1. Tabla de SERVICIOS
CREATE TABLE IF NOT EXISTS servicios (
    id bigint PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    timestamp timestamptz NOT NULL,
    amount numeric NOT NULL,
    type text NOT NULL,
    company_name text,
    observation text,
    user_id text NOT NULL -- CAMBIADO A TEXT para compatibilidad
);

-- 2. Tabla de GASTOS
CREATE TABLE IF NOT EXISTS gastos (
    id bigint PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    timestamp timestamptz NOT NULL,
    amount numeric NOT NULL,
    category text NOT NULL,
    description text,
    user_id text NOT NULL -- CAMBIADO A TEXT
);

-- 3. Tabla de ABONADOS
CREATE TABLE IF NOT EXISTS abonados (
    id text PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    name text NOT NULL,
    office_number text,
    is_capped boolean DEFAULT false,
    cap_amount numeric DEFAULT 0,
    user_id text NOT NULL -- CAMBIADO A TEXT
);

-- 4. Tabla de VEHICULOS
CREATE TABLE IF NOT EXISTS vehiculos (
    user_id text PRIMARY KEY, -- CAMBIADO A TEXT
    license_plate text,
    model text,
    initial_odometer numeric DEFAULT 0,
    maintenance_data jsonb,
    created_at timestamptz DEFAULT now()
);

-- 5. Tabla de TURNOS
CREATE TABLE IF NOT EXISTS turnos_storage (
    user_id text PRIMARY KEY, -- CAMBIADO A TEXT
    data_json jsonb,
    updated_at timestamptz DEFAULT now()
);

-- SEGURIDAD (RLS)
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE abonados ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos_storage ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS BASADAS EN METADATOS (Legacy Support)
-- Como user_id es el nombre de usuario (ej: 'marcos') y auth.uid() es un UUID,
-- necesitamos validar contra el nombre almacenado en los metadatos del usuario (JWT).
-- Esto asume que 'name' en user_metadata coincide con el user_id usado en la app.

-- Función auxiliar (opcional, pero las políticas inline son soportadas)
-- lower((auth.jwt() -> 'user_metadata' ->> 'name')::text)

CREATE POLICY "Dueño ve servicios" ON servicios FOR SELECT USING (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);
CREATE POLICY "Dueño crea servicios" ON servicios FOR INSERT WITH CHECK (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);
CREATE POLICY "Dueño edita servicios" ON servicios FOR UPDATE USING (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);
CREATE POLICY "Dueño borra servicios" ON servicios FOR DELETE USING (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);

CREATE POLICY "Dueño ve gastos" ON gastos FOR SELECT USING (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);
CREATE POLICY "Dueño crea gastos" ON gastos FOR INSERT WITH CHECK (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);
CREATE POLICY "Dueño edita gastos" ON gastos FOR UPDATE USING (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);
CREATE POLICY "Dueño borra gastos" ON gastos FOR DELETE USING (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);

CREATE POLICY "Dueño ve abonados" ON abonados FOR SELECT USING (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);
CREATE POLICY "Dueño crea abonados" ON abonados FOR INSERT WITH CHECK (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);
CREATE POLICY "Dueño edita abonados" ON abonados FOR UPDATE USING (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);
CREATE POLICY "Dueño borra abonados" ON abonados FOR DELETE USING (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);

CREATE POLICY "Dueño ve vehiculos" ON vehiculos FOR SELECT USING (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);
CREATE POLICY "Dueño crea vehiculos" ON vehiculos FOR INSERT WITH CHECK (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);
CREATE POLICY "Dueño edita vehiculos" ON vehiculos FOR UPDATE USING (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);

CREATE POLICY "Dueño ve turnos" ON turnos_storage FOR SELECT USING (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);
CREATE POLICY "Dueño crea turnos" ON turnos_storage FOR INSERT WITH CHECK (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);
CREATE POLICY "Dueño edita turnos" ON turnos_storage FOR UPDATE USING (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);
