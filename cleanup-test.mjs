#!/usr/bin/env node

/**
 * Script para limpiar servicio de prueba
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n🧹 Limpiando servicio de prueba...\n');

// Eliminar servicio de prueba
const { error } = await supabase
    .from('servicios')
    .delete()
    .like('observation', '%prueba - normalización%');

if (error) {
    console.error('Error:', error.message);
} else {
    console.log('✅ Servicio de prueba eliminado');
}

// Verificar
const { data } = await supabase
    .from('servicios')
    .select('*');

console.log(`\n📊 Servicios restantes: ${data?.length || 0}\n`);
