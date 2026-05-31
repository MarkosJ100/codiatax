import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('🔍 Buscando Ticket #10547...');
    const { data, error } = await supabase
        .from('servicios')
        .select('*')
        .ilike('observation', '%10547%');

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('❌ No encontrado en base de datos. Probablemente está en local o falló el sync.');
    }

    data.forEach(s => {
        console.log(`ID: ${s.id} | Amount: ${s.amount} | Observation: ${s.observation}`);
    });
}

inspect();
