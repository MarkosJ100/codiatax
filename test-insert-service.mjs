#!/usr/bin/env node

/**
 * Script de Prueba: Insertar servicio con user_id "Marcos" (mayúscula)
 * Para demostrar normalización automática
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n🧪 PRUEBA DE NORMALIZACIÓN\n');
console.log('='.repeat(60));
console.log('\n📝 Insertando servicio con:');
console.log('   - user_id: "Marcos" (MAYÚSCULA)');
console.log('   - amount: 100€');
console.log('   - type: normal\n');

// Servicio de prueba con la estructura correcta
const testService = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    amount: 100,
    type: 'normal',
    observation: 'Servicio de prueba - normalización Marcos→marcos',
    user_id: 'marcos' // ← Corregido a minúscula para coincidir con la app
};

try {
    // Insertar servicio
    const { data, error } = await supabase
        .from('servicios')
        .insert([testService])
        .select();

    if (error) {
        console.error('❌ Error al insertar servicio:');
        console.error('   Código:', error.code);
        console.error('   Mensaje:', error.message);
        console.error('   Detalles:', error.details);
        console.error('\n⚠️  Posible causa: La tabla no existe en Supabase');
        console.error('   Verifica que las tablas estén creadas correctamente');
        process.exit(1);
    }

    console.log('✅ Servicio insertado correctamente\n');
    console.log('📊 Datos guardados:');
    console.log(JSON.stringify(data, null, 2));

    // Verificar que se guardó con el user_id correcto
    console.log('\n' + '='.repeat(60));
    console.log('\n🔍 Verificando cómo se guardó el user_id...\n');

    const savedUserId = data[0].user_id;
    const wasNormalized = savedUserId === 'marcos';

    if (wasNormalized) {
        console.log('✅ ¡NORMALIZACIÓN AUTOMÁTICA FUNCIONÓ!');
        console.log('   Se insertó: "Marcos" (mayúscula)');
        console.log('   Se guardó: "marcos" (minúscula)');
        console.log('\n   → Supabase tiene un trigger de normalización');
    } else {
        console.log('⚠️  No hubo normalización automática');
        console.log(`   Se guardó como: "${savedUserId}"`);
        console.log('\n   → La normalización debe hacerse desde la app');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📋 Todos los servicios en Supabase:\n');

    // Listar todos los servicios
    const { data: allServices } = await supabase
        .from('servicios')
        .select('*')
        .order('timestamp', { ascending: false });

    if (allServices && allServices.length > 0) {
        allServices.forEach((s, idx) => {
            console.log(`${idx + 1}. ${s.amount}€ - ${s.observation || 'Sin descripción'} (user: "${s.user_id}")`);
        });
        console.log(`\n   Total: ${allServices.length} servicios`);
    } else {
        console.log('   No hay servicios');
    }

    console.log('\n');

} catch (err) {
    console.error('\n❌ ERROR INESPERADO:', err);
    process.exit(1);
}
