-- =================================================================
-- FIX: Row Level Security (RLS) para la tabla 'abonados'
-- =================================================================
-- Este script soluciona el error 42501 (Violation of RLS policy)
-- asegurando que el acceso se base en el nombre de usuario de los metadatos.

-- 1. Eliminar políticas antiguas que puedan estar causando conflictos
DROP POLICY IF EXISTS "Usuarios ven sus abonados" ON abonados;
DROP POLICY IF EXISTS "Usuarios insertan sus abonados" ON abonados;
DROP POLICY IF EXISTS "Usuarios actualizan sus abonados" ON abonados;
DROP POLICY IF EXISTS "Usuarios borran sus abonados" ON abonados;
DROP POLICY IF EXISTS "Dueño ven abonados" ON abonados;
DROP POLICY IF EXISTS "Dueño crea abonados" ON abonados;
DROP POLICY IF EXISTS "Dueño edita abonados" ON abonados;
DROP POLICY IF EXISTS "Dueño borra abonados" ON abonados;

-- 2. Asegurar que RLS esté activo
ALTER TABLE abonados ENABLE ROW LEVEL SECURITY;

-- 3. Crear las políticas definitivas basadas en el NOMBRE del usuario (metadata)
-- Nota: La app usa normalizeUsername (lower case) para guardar en user_id.

CREATE POLICY "Acceso total abonados" ON abonados 
FOR ALL 
TO authenticated 
USING (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
)
WITH CHECK (
  lower((auth.jwt() -> 'user_metadata' ->> 'name')::text) = lower(user_id)
);

-- 4. Verificación: Listar políticas actuales de la tabla (opcional)
-- SELECT * FROM pg_policies WHERE tablename = 'abonados';
