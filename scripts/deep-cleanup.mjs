import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function finalCleanup() {
    console.log('🧹 Limpieza PROFUNDA de la base de datos...');

    // 1. Obtener todos los servicios del usuario 'marcos'
    const { data: allServices, error } = await supabase
        .from('servicios')
        .select('*')
        .eq('user_id', 'marcos');

    if (error) {
        console.error('Error fetching:', error.message);
        return;
    }

    console.log(`Analizando ${allServices.length} servicios...`);

    const seen = new Map();
    const toDelete = [];
    const toUpdate = [];

    for (const s of allServices) {
        // Clave de duplicidad: Tiempo (truncado a minuto si acaso) + Observación
        // Pero el timestamp ya suele ser exacto.
        const key = `${s.timestamp}_${s.observation}`;

        // Si ya lo hemos visto, este es un duplicado para borrar
        if (seen.has(key)) {
            const first = seen.get(key);
            // Si el actual tiene un importe "mejor" (ej: 6.42 vs 642), nos quedamos con el mejor
            // pero por ahora simplemente borramos el extra.
            if (first.amount > 100 && s.amount < 100) {
                // El primero estaba mal, borramos el primero y guardamos este
                toDelete.push(first.id);
                seen.set(key, s);
            } else {
                toDelete.push(s.id);
            }
            continue;
        }

        seen.set(key, s);

        // Además, si el importe es sospechoso (>100€ para un Ticket #), marcar para corregir
        if (s.amount > 100 && s.observation && s.observation.includes('Ticket #')) {
            // Caso especial: si es de El Puerto y es > 1000, probablemente / 100
            // Si es de Jerez y es > 200, probablemente / 100
            const newAmount = s.amount / 100;
            console.log(`✏️ Programando corrección: ID ${s.id} | ${s.amount}€ -> ${newAmount}€`);
            toUpdate.push({ id: s.id, amount: newAmount });
        }
    }

    console.log(`Borrando ${toDelete.length} duplicados...`);
    for (const id of toDelete) {
        await supabase.from('servicios').delete().eq('id', id);
    }

    console.log(`Actualizando ${toUpdate.length} servicios inflados...`);
    for (const up of toUpdate) {
        await supabase.from('servicios').update({ amount: up.amount }).eq('id', up.id);
    }

    console.log('✅ Base de datos saneada completamente.');
}

finalCleanup();
