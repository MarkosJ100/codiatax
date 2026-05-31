import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Faltan variables de entorno Supabase.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function find10547() {
    console.log('🔍 Buscando Ticket #10547...');
    const { data, error } = await supabase.from('servicios').select('*').ilike('observation', '%10547%');

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    if (data && data.length > 0) {
        data.forEach(s => {
            console.log(`✅ ENCONTRADO: ID ${s.id} | Amount: ${s.amount}€ | Observation: ${s.observation}`);
        });
    } else {
        console.log('❌ Ticket #10547 no encontrado.');
    }
}

find10547();
