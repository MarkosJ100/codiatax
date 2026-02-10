import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: No se encontraron las credenciales de Supabase en .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetDatabase() {
    console.log('\n🗑️  INICIANDO LIMPIEZA TOTAL DE BASE DE DATOS...\n');

    // Lista de tablas a limpiar
    const tables = ['vehiculos', 'servicios', 'gastos', 'turnos_storage'];

    for (const table of tables) {
        process.stdout.write(`   Limpiando tabla "${table}"... `);

        // Usamos delete() sin where para borrar todo (equivalente a truncate en permisos RLS permisivos o service role)
        // Nota: Con anon key, esto depende de las RLS. Si falla, el usuario deberá hacerlo manual.
        // Intentaremos usar RPC 'execute_sql' primero si existe (ya vimos en el otro script que fallaba),
        // así que usaremos delete.

        const { error } = await supabase.from(table).delete().neq('id', -1); // Truco para borrar todo si la col id existe
        // Para tablas sin id numérico o con uuid, necesitamos otra estrategia o un filtro que cubra todo.
        // vehiculos usa license_plate como PK o user_id? Revisemos types.
        // vehiculos: licensePlate (string)
        // servicios: id (number)
        // gastos: id (number)
        // turnos_storage: user_id (string)

        let deleteError = error;

        if (table === 'vehiculos') {
            const { error: e } = await supabase.from(table).delete().neq('license_plate', 'ZZZ99999dummy');
            deleteError = e;
        } else if (table === 'turnos_storage') {
            const { error: e } = await supabase.from(table).delete().neq('user_id', 'dummy');
            deleteError = e;
        } else {
            // services y gastos usan id numerico
            const { error: e } = await supabase.from(table).delete().gt('id', -1);
            deleteError = e;
        }

        if (deleteError) {
            console.log('❌ ERROR');
            console.error(`   ${deleteError.message}`);
        } else {
            console.log('✅ OK');
        }
    }

    console.log('\n⚠️  NOTA: Los usuarios de autenticación (Auth Users) deben borrarse desde el panel de Supabase.');
    console.log('   Este script solo limpia los datos de la aplicación.');
    console.log('\n✨ Limpieza finalizada.');
}

resetDatabase();
