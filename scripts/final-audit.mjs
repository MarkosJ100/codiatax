import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function finalAudit() {
    console.log('🛠️ Auditoría FINAL de importes...');

    // Buscar TODOS los servicios que parezcan venir de una importación (Ticket #)
    // y tengan importes desmesurados para trayectos locales (>100€)
    const { data: records, error } = await supabase
        .from('servicios')
        .select('*')
        .ilike('observation', '%Ticket #%')
        .gt('amount', 80); // Umbral de 80€ (un taxi local raro pasa de esto)

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log(`Analizando ${records.length} registros potencialmente inflados...`);

    for (const s of records) {
        // Si el importe es exactamente un múltiplo de algo (ej: 2000, 550) 
        // o simplemente es sospechoso en la serie 10xxx o 14xxx
        if (s.amount > 100) {
            const newAmount = s.amount / 100;
            console.log(`⚠️ REPARANDO: ID ${s.id} | ${s.amount}€ -> ${newAmount}€ | ${s.observation}`);

            await supabase
                .from('servicios')
                .update({ amount: newAmount })
                .eq('id', s.id);
        } else {
            console.log(`ℹ️ Manteniendo: ID ${s.id} | ${s.amount}€ | ${s.observation}`);
        }
    }

    console.log('🏁 Auditoría finalizada.');
}

finalAudit();
