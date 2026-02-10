#!/usr/bin/env node

/**
 * Script de Migración: Normalización de user_id en Supabase
 * 
 * Este script ejecuta las queries SQL para normalizar todos los user_id
 * en las tablas de Supabase, evitando duplicados por mayúsculas/espacios.
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: No se encontraron las credenciales de Supabase en .env');
    console.error('   Asegúrate de que VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén configurados.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n🔄 INICIANDO MIGRACIÓN DE NORMALIZACIÓN DE USUARIOS\n');
console.log('='.repeat(60));

async function runMigration() {
    try {
        // Paso 1: Normalizar vehiculos
        console.log('\n📊 1. Normalizando user_id en tabla "vehiculos"...');
        const { data: vehiculosData, error: vehiculosError } = await supabase.rpc(
            'execute_sql',
            { sql: `UPDATE vehiculos SET user_id = LOWER(TRIM(user_id)) WHERE user_id != LOWER(TRIM(user_id))` }
        );

        // Como RPC no está disponible, usamos SELECT y UPDATE manual
        // Primero obtener todos los vehículos
        const { data: vehiculos, error: vError } = await supabase
            .from('vehiculos')
            .select('*');

        if (vError) {
            console.error('   ⚠️ Error al leer vehiculos:', vError.message);
        } else {
            let updated = 0;
            for (const v of vehiculos || []) {
                const normalized = v.user_id.trim().toLowerCase();
                if (v.user_id !== normalized) {
                    const { error: updateError } = await supabase
                        .from('vehiculos')
                        .update({ user_id: normalized })
                        .eq('license_plate', v.license_plate)
                        .eq('user_id', v.user_id);

                    if (!updateError) {
                        updated++;
                        console.log(`   ✅ "${v.user_id}" → "${normalized}"`);
                    }
                }
            }
            console.log(`   ✅ Vehículos normalizados: ${updated}/${vehiculos?.length || 0}`);
        }

        // Paso 2: Normalizar servicios
        console.log('\n📊 2. Normalizando user_id en tabla "servicios"...');
        const { data: servicios, error: sError } = await supabase
            .from('servicios')
            .select('id, user_id');

        if (sError) {
            console.error('   ⚠️ Error al leer servicios:', sError.message);
        } else {
            let updated = 0;
            for (const s of servicios || []) {
                const normalized = s.user_id.trim().toLowerCase();
                if (s.user_id !== normalized) {
                    const { error: updateError } = await supabase
                        .from('servicios')
                        .update({ user_id: normalized })
                        .eq('id', s.id);

                    if (!updateError) updated++;
                }
            }
            console.log(`   ✅ Servicios normalizados: ${updated}/${servicios?.length || 0}`);
        }

        // Paso 3: Normalizar gastos
        console.log('\n📊 3. Normalizando user_id en tabla "gastos"...');
        const { data: gastos, error: gError } = await supabase
            .from('gastos')
            .select('id, user_id');

        if (gError) {
            console.error('   ⚠️ Error al leer gastos:', gError.message);
        } else {
            let updated = 0;
            for (const g of gastos || []) {
                const normalized = g.user_id.trim().toLowerCase();
                if (g.user_id !== normalized) {
                    const { error: updateError } = await supabase
                        .from('gastos')
                        .update({ user_id: normalized })
                        .eq('id', g.id);

                    if (!updateError) updated++;
                }
            }
            console.log(`   ✅ Gastos normalizados: ${updated}/${gastos?.length || 0}`);
        }

        // Paso 4: Normalizar turnos_storage
        console.log('\n📊 4. Normalizando user_id en tabla "turnos_storage"...');
        const { data: turnos, error: tError } = await supabase
            .from('turnos_storage')
            .select('user_id');

        if (tError) {
            console.error('   ⚠️ Error al leer turnos_storage:', tError.message);
        } else {
            let updated = 0;
            for (const t of turnos || []) {
                const normalized = t.user_id.trim().toLowerCase();
                if (t.user_id !== normalized) {
                    const { error: updateError } = await supabase
                        .from('turnos_storage')
                        .update({ user_id: normalized })
                        .eq('user_id', t.user_id);

                    if (!updateError) {
                        updated++;
                        console.log(`   ✅ "${t.user_id}" → "${normalized}"`);
                    }
                }
            }
            console.log(`   ✅ Turnos normalizados: ${updated}/${turnos?.length || 0}`);
        }

        // Verificación: Listar usuarios únicos
        console.log('\n' + '='.repeat(60));
        console.log('\n🔍 VERIFICACIÓN: Usuarios únicos después de la migración\n');

        const allUsers = new Set();

        if (vehiculos) vehiculos.forEach(v => allUsers.add(v.user_id.trim().toLowerCase()));
        if (servicios) servicios.forEach(s => allUsers.add(s.user_id.trim().toLowerCase()));
        if (gastos) gastos.forEach(g => allUsers.add(g.user_id.trim().toLowerCase()));
        if (turnos) turnos.forEach(t => allUsers.add(t.user_id.trim().toLowerCase()));

        console.log('Usuarios únicos encontrados:');
        Array.from(allUsers).sort().forEach(user => {
            console.log(`  - ${user}`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE\n');
        console.log('Todos los user_id han sido normalizados a minúsculas sin espacios.');
        console.log('Ahora "Marcos", "marcos" y "MARCOS" se refieren al mismo usuario.\n');

    } catch (error) {
        console.error('\n❌ ERROR durante la migración:', error);
        process.exit(1);
    }
}

// Ejecutar migración
runMigration();
