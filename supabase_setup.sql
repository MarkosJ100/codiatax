-- Estructura de tablas para Codiatax

-- 1. Servicios
CREATE TABLE IF NOT EXISTS servicios (
  id BIGINT PRIMARY KEY, -- Usamos el timestamp local como ID para consistencia
  timestamp TIMESTAMPTZ DEFAULT now(),
  amount DECIMAL(10,2) NOT NULL,
  type TEXT,
  company_name TEXT,
  observation TEXT,
  user_id TEXT
);

-- 2. Gastos
CREATE TABLE IF NOT EXISTS gastos (
  id BIGINT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT now(),
  amount DECIMAL(10,2) NOT NULL,
  category TEXT,
  description TEXT,
  type TEXT,
  user_id TEXT
);

-- 3. Vehículos y Mantenimiento
CREATE TABLE IF NOT EXISTS vehiculos (
  license_plate TEXT PRIMARY KEY,
  model TEXT,
  initial_odometer INTEGER,
  maintenance_data JSONB,
  user_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Turnos (Configuración y Asignaciones)
CREATE TABLE IF NOT EXISTS turnos_storage (
  user_id TEXT PRIMARY KEY,
  data_json JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS (Seguridad)
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos_storage ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (Lectura/Escritura abierta para el anon key simplificado)
CREATE POLICY "Public Access" ON servicios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON gastos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON vehiculos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON turnos_storage FOR ALL USING (true) WITH CHECK (true);
