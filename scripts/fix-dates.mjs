import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fixIncorrectDates() {
    console.log('📅 Reparando fechas (Abril -> Marzo)...');

    // Buscar servicios del usuario marcos que están en Abril de 2026
    const { data: records, error } = await supabase
        .from('servicios')
        .select('*')
        .eq('user_id', 'marcos')
        .gte('timestamp', '2026-04-01T00:00:00Z')
        .lte('timestamp', '2026-04-30T23:59:59Z');

    if (error) {
        console.error('Error fetching:', error.message);
        return;
    }

    console.log(`Detectados ${records.length} servicios en Abril que probablemente son de Marzo.`);

    for (const s of records) {
        // '2026-04-03T...' -> queremos '2026-03-04T...'
        // O simplemente intercambiar el día y el mes en la cadena ISO
        // Formato esperado: YYYY-MM-DD...
        const iso = s.timestamp;
        const parts = iso.split('-');
        if (parts.length >= 3) {
            const year = parts[0];
            const month = parts[1]; // '04'
            const dayPart = parts[2].substring(0, 2); // '03'
            const rest = parts[2].substring(2);

            if (month === '04' && (dayPart === '03' || dayPart === '04')) {
                // Intercambiamos mes (part 1) y día (part 2)
                // En realidad, muchos archivos tienen el formato 04/03 (4 de marzo) 
                // pero se leyó como 3 de abril.
                const newIso = `${year}-03-${month}${rest}`;

                console.log(`🔄 Reparando Ticket: ${s.observation.split(' ')[1]} | ${iso} -> ${newIso}`);

                await supabase
                    .from('servicios')
                    .update({ timestamp: newIso })
                    .eq('id', s.id);
            }
        }
    }

    console.log('✅ Reparación de fechas finalizada.');
}

fixIncorrectDates();
