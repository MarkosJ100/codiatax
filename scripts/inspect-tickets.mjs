import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('🔍 Inspeccionando tickets 14100 al 14104...');
    // Buscar servicios que contengan estos números en la observación
    const { data, error } = await supabase
        .from('servicios')
        .select('*');

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    const filtered = (data || []).filter(s =>
        String(s.observation).includes('14100') ||
        String(s.observation).includes('14101') ||
        String(s.observation).includes('14102') ||
        String(s.observation).includes('14103') ||
        String(s.observation).includes('14104')
    );

    if (filtered.length === 0) {
        console.log('❌ No se encontraron tickets con esos números.');
    }

    filtered.forEach(s => {
        console.log(`ID: ${s.id} | Amount: ${s.amount} | Observation: ${s.observation}`);
    });
}

inspect();
