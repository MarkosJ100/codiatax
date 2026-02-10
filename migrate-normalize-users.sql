-- =================================================================
-- Script de Migración: Normalización de user_id
-- =================================================================
-- Este script normaliza todos los user_id en Supabase para evitar
-- duplicados causados por mayúsculas/minúsculas y espacios.
--
-- IMPORTANTE: Ejecutar este script UNA SOLA VEZ en Supabase SQL Editor
-- =================================================================

-- 1. Normalizar user_id en tabla 'vehiculos'
UPDATE vehiculos 
SET user_id = LOWER(TRIM(user_id))
WHERE user_id != LOWER(TRIM(user_id));

-- 2. Normalizar user_id en tabla 'servicios'
UPDATE servicios 
SET user_id = LOWER(TRIM(user_id))
WHERE user_id != LOWER(TRIM(user_id));

-- 3. Normalizar user_id en tabla 'gastos'
UPDATE gastos 
SET user_id = LOWER(TRIM(user_id))
WHERE user_id != LOWER(TRIM(user_id));

-- 4. Normalizar user_id en tabla 'turnos_storage'
UPDATE turnos_storage 
SET user_id = LOWER(TRIM(user_id))
WHERE user_id != LOWER(TRIM(user_id));

-- =================================================================
-- Verificación: Listar todos los user_id únicos después de migración
-- =================================================================
-- Ejecuta esta query después de la migración para confirmar que no hay duplicados

SELECT DISTINCT user_id, COUNT(*) as total_registros
FROM (
    SELECT user_id FROM vehiculos
    UNION ALL
    SELECT user_id FROM servicios
    UNION ALL
    SELECT user_id FROM gastos
    UNION ALL
    SELECT user_id FROM turnos_storage
) AS all_users
GROUP BY user_id
ORDER BY user_id;

-- =================================================================
-- Resultado esperado:
-- Deberías ver solo nombres en minúsculas sin espacios extra
-- Ejemplo:
--   user_id | total_registros
--   --------+----------------
--   marcos  | 25
--   juan    | 18
-- =================================================================
