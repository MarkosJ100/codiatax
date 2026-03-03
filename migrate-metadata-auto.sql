-- =================================================================
-- Script de Migración Automática: Metadatos de Usuario
-- =================================================================
-- Ejecuta este script en el SQL EDITOR de Supabase.
-- 
-- ¿Qué hace?
-- Toma el valor de 'name' que está en 'user_metadata' (público)
-- y lo copia a 'app_metadata' (protegido/interno).
-- =================================================================

UPDATE auth.users
SET raw_app_meta_data = 
  coalesce(raw_app_meta_data, '{}'::jsonb) || 
  jsonb_build_object('name', raw_user_meta_data->>'name')
WHERE raw_user_meta_data->>'name' IS NOT NULL;

-- =================================================================
-- COMPROBACIÓN:
-- Ejecuta esto después para ver si los nombres se han copiado bien:
-- =================================================================
-- SELECT id, email, raw_app_meta_data->>'name' as nombre_seguro 
-- FROM auth.users;
