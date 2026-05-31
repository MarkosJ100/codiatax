import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('🔍 Inspeccionando últimos 50 servicios...');
    const { data, error } = await supabase
        .from('servicios')
        .select('*')
        .order('id', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    (data || []).forEach(s => {
        console.log(`ID: ${s.id} | Amount: ${s.amount} | Observation: ${s.observation}`);
    });
}

inspect();
