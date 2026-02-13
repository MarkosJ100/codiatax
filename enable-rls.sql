-- Habilitar RLS en todas las tablas
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE abonados ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos_storage ENABLE ROW LEVEL SECURITY;

-- Políticas para Servicios (servicios)
CREATE POLICY "Usuarios ven sus servicios" ON servicios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios insertan sus servicios" ON servicios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios actualizan sus servicios" ON servicios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios borran sus servicios" ON servicios FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Gastos (gastos)
CREATE POLICY "Usuarios ven sus gastos" ON gastos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios insertan sus gastos" ON gastos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios actualizan sus gastos" ON gastos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios borran sus gastos" ON gastos FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Abonados (abonados)
CREATE POLICY "Usuarios ven sus abonados" ON abonados FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios insertan sus abonados" ON abonados FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios actualizan sus abonados" ON abonados FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios borran sus abonados" ON abonados FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Vehículos (vehiculos)
CREATE POLICY "Usuarios ven sus vehiculos" ON vehiculos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios insertan sus vehiculos" ON vehiculos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios actualizan sus vehiculos" ON vehiculos FOR UPDATE USING (auth.uid() = user_id);
-- Nota: Borrar vehículos puede ser restrictivo, se añade por consistencia
CREATE POLICY "Usuarios borran sus vehiculos" ON vehiculos FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Turnos (turnos_storage)
CREATE POLICY "Usuarios ven sus turnos" ON turnos_storage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios insertan sus turnos" ON turnos_storage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios actualizan sus turnos" ON turnos_storage FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios borran sus turnos" ON turnos_storage FOR DELETE USING (auth.uid() = user_id);
