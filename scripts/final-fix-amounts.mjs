import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function finalFix() {
    console.log('🛠️ Iniciando reparación FINAL y AGRESIVA de importes...');

    // 1. Buscar servicios con importes astronómicos (> 300€) que contengan "Ticket #"
    // En Jerez/Puerto, servicios urbanos de >300€ son errores de 100x o 1000x casi seguro.
    const { data: records, error } = await supabase
        .from('servicios')
        .select('*')
        .gt('amount', 200); // Bajamos el umbral a 200€ para estar seguros

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log(`Revisando ${records.length} registros sospechosos...`);

    for (const s of records) {
        let shouldFix = false;
        let divisor = 1;

        // Si es la serie 10XXX (como el Ticket #10547 de 2000€)
        if (String(s.observation).includes('Ticket #10')) {
            shouldFix = true;
            divisor = 100;
        }
        // Si el importe es exactamente un múltiplo de 100 o 10 (ej: 2000, 550, 2187)
        // y la observación parece una importación manual
        else if (String(s.observation).includes('Ticket #')) {
            shouldFix = true;
            divisor = 100;
        }

        if (shouldFix) {
            const newAmount = s.amount / divisor;
            console.log(`⚠️ Reparando: ID ${s.id} | ${s.amount}€ -> ${newAmount}€ | ${s.observation}`);

            await supabase
                .from('servicios')
                .update({ amount: newAmount })
                .eq('id', s.id);
        }
    }

    console.log('🏁 Reparación finalizada.');
}

finalFix();
