#!/usr/bin/env node

/**
 * Script para verificar esquema de tablas en Supabase
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n🔍 Verificando esquema de tabla servicios...\n');

// Intentar obtener un servicio para ver su estructura
const { data: sample, error } = await supabase
    .from('servicios')
    .select('*')
    .limit(1);

if (error) {
    console.error('Error:', error.message);
} else if (sample && sample.length > 0) {
    console.log('Estructura de un servicio existente:');
    console.log(JSON.stringify(sample[0], null, 2));
    console.log('\nCampos disponibles:', Object.keys(sample[0]));
} else {
    console.log('❌ No hay servicios existentes para ver la estructura');
    console.log('\nIntentando insertar servicio simplificado...\n');

    // Intentar con campos mínimos
    const minimalService = {
        amount: 100,
        description: 'Prueba',
        timestamp: new Date().toISOString(),
        user_id: 'Marcos'
    };

    const { data: inserted, error: insertError } = await supabase
        .from('servicios')
        .insert([minimalService])
        .select();

    if (insertError) {
        console.error('❌ Error al insertar:', insertError.message);
        console.error('Detalles:', insertError);
    } else {
        console.log('✅ Servicio insertado:');
        console.log(JSON.stringify(inserted, null, 2));
    }
}
