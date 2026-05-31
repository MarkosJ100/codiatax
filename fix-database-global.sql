-- =================================================================
-- FIX GLOBAL: Esquema y Seguridad (RLS)
-- =================================================================
-- Ejecuta este script para solucionar:
-- 1. Columna 'subscriber_id' faltante en 'servicios' (Error PGRST204)
-- 2. Violación de políticas RLS en 'abonados' (Error 42501)

-- -----------------------------------------------------------------
-- PARTE 1: Corrección de Esquema (servicios)
-- -----------------------------------------------------------------

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='servicios' AND column_name='subscriber_id') THEN
        ALTER TABLE servicios ADD COLUMN subscriber_id text;
        RAISE NOTICE 'Columna subscriber_id añadida a servicios';
    END IF;
END $$;

-- -----------------------------------------------------------------
-- PARTE 2: Corrección de Seguridad (abonados)
-- -----------------------------------------------------------------

-- Eliminar políticas antiguas conflictivas
DROP POLICY IF EXISTS "Usuarios ven sus abonados" ON abonados;
DROP POLICY IF EXISTS "Usuarios insertan sus abonados" ON abonados;
DROP POLICY IF EXISTS "Usuarios actualizan sus abonados" ON abonados;
DROP POLICY IF EXISTS "Usuarios borran sus abonados" ON abonados;
DROP POLICY IF EXISTS "Dueño ven abonados" ON abonados;
DROP POLICY IF EXISTS "Dueño crea abonados" ON abonados;
DROP POLICY IF EXISTS "Dueño edita abonados" ON abonados;
DROP POLICY IF EXISTS "Dueño borra abonados" ON abonados;
DROP POLICY IF EXISTS "Acceso total abonados" ON abonados;

-- Asegurar RLS activo
ALTER TABLE abonados ENABLE ROW LEVEL SECURITY;

-- Crear política definitiva basada en metadata del usuario
CREATE POLICY "Acceso total abonados" ON abonados 
FOR ALL 
TO authenticated 
USING (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
)
WITH CHECK (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);

-- -----------------------------------------------------------------
-- PARTE 3: Refrescar Caché de PostgREST (Opcional pero recomendado)
-- -----------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
