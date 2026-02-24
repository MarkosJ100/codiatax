#!/usr/bin/env node

/**
 * Script mejorado para verificar datos en Supabase
 * Muestra servicios con más detalle para debugging
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Credenciales de Supabase no encontradas en .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n=== Verificando datos en Supabase ===\n');

// 1. Servicios
const { data: servicios, error: errorServicios } = await supabase
    .from('servicios')
    .select('*')
    .order('timestamp', { ascending: false });

console.log(`📊 Total de servicios encontrados: ${servicios?.length || 0}`);

if (servicios && servicios.length > 0) {
    console.log('\nÚltimos servicios:');
    servicios.slice(0, 10).forEach((s, idx) => {
        console.log(`${idx + 1}. ${s.timestamp} - ${s.amount}€ - ${s.description || 'Sin descripción'} (user: ${s.user_id})`);
    });
} else {
    console.log('⚠️  No hay servicios en Supabase');
}

console.log('\n---\n');

// 2. Gastos
const { data: gastos, error: errorGastos } = await supabase
    .from('gastos')
    .select('*')
    .order('timestamp', { ascending: false });

console.log(`💰 Total de gastos encontrados: ${gastos?.length || 0}`);

if (gastos && gastos.length > 0) {
    console.log('\nÚltimos gastos:');
    gastos.slice(0, 10).forEach((g, idx) => {
        console.log(`${idx + 1}. ${g.timestamp} - ${g.amount}€ - ${g.category} (user: ${g.user_id})`);
    });
}

console.log('\n---\n');

// 3. Vehículos
const { data: vehiculos, error: errorVehiculos } = await supabase
    .from('vehiculos')
    .select('*');

console.log(`🚗 Total de vehículos encontrados: ${vehiculos?.length || 0}`);

if (vehiculos && vehiculos.length > 0) {
    vehiculos.forEach((v, idx) => {
        console.log(`${idx + 1}. ${v.license_plate} - ${v.model} (user: ${v.user_id})`);
    });
}

console.log('\n---\n');

// 4. Buscar servicios de HOY específicamente
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
console.log(`🔍 Buscando servicios de HOY (${today}):\n`);

const { data: serviciosHoy, error: errorHoy } = await supabase
    .from('servicios')
    .select('*')
    .gte('timestamp', `${today}T00:00:00`)
    .lte('timestamp', `${today}T23:59:59`);

console.log(`Total servicios de hoy: ${serviciosHoy?.length || 0}`);

if (serviciosHoy && serviciosHoy.length > 0) {
    serviciosHoy.forEach((s, idx) => {
        console.log(`${idx + 1}. ${s.amount}€ - ${s.description || 'Sin descripción'} (${s.timestamp})`);
    });
} else {
    console.log('❌ No hay servicios de hoy en Supabase');
}

console.log('\n---\n');

// 6. Abonados
const { data: abonados, error: errorAbonados } = await supabase
    .from('abonados')
    .select('*');

console.log(`📋 Total de abonados encontrados: ${abonados?.length || 0}`);

if (abonados && abonados.length > 0) {
    abonados.forEach((a, idx) => {
        console.log(`${idx + 1}. ${a.name} (ID: ${a.id}) (user: ${a.user_id})`);
    });
}

console.log('\n---\n');

// 7. Verificar todos los user_id únicos (incluyendo abonados)
const allUserIds = new Set();
if (servicios) servicios.forEach(s => allUserIds.add(s.user_id));
if (gastos) gastos.forEach(g => allUserIds.add(g.user_id));
if (vehiculos) vehiculos.forEach(v => allUserIds.add(v.user_id));
if (abonados) abonados.forEach(a => allUserIds.add(a.user_id));

console.log('👥 Usuarios únicos encontrados:');
if (allUserIds.size > 0) {
    Array.from(allUserIds).forEach(uid => console.log(`  - "${uid}"`));
} else {
    console.log('  (ninguno)');
}

console.log('\n');
