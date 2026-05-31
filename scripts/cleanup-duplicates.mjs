import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: No se encontraron credenciales.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('🔄 Buscando servicios duplicados...');

    // 1. Obtener todos los servicios
    const { data: services, error } = await supabase.from('servicios').select('*');
    if (error) {
        console.error('❌ Error al obtener servicios:', error.message);
        return;
    }

    console.log(`📦 Se encontraron ${services.length} servicios totales.`);

    const seen = new Map();
    const toDelete = [];

    // 2. Identificar duplicados usando la misma lógica que ExportMenu
    for (const s of services) {
        const timeMs = new Date(s.timestamp).getTime();
        const normAmount = Number(s.amount).toFixed(2);
        const normObs = String(s.observation || '').trim();
        const key = `${s.user_id}_${timeMs}_${normAmount}_${s.type}_${normObs}`;

        if (seen.has(key)) {
            // Es un duplicado. Guardamos el ID para borrarlo.
            toDelete.push(s.id);
        } else {
            seen.set(key, s.id);
        }
    }

    if (toDelete.length === 0) {
        console.log('✅ No se encontraron duplicados.');
        return;
    }

    console.log(`🗑️ Se encontraron ${toDelete.length} duplicados para borrar.`);

    // 3. Borrar por lotes (Supabase permite borrar con .in)
    const batchSize = 100;
    for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = toDelete.slice(i, i + batchSize);
        console.log(`   Borrando lote ${i / batchSize + 1}...`);
        const { error: delError } = await supabase
            .from('servicios')
            .delete()
            .in('id', batch);

        if (delError) {
            console.error('   ❌ Error al borrar lote:', delError.message);
        }
    }

    console.log('✨ Limpieza completada.');
}

cleanup();
