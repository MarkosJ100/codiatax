import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSpecific() {
    console.log('🛠️ Reparando Ticket #10547 y serie 10XXX...');

    const { data: records, error } = await supabase
        .from('servicios')
        .select('*')
        .ilike('observation', '%10547%')
        .eq('amount', 2000);

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    if (records && records.length > 0) {
        for (const s of records) {
            console.log(`⚠️ ID ${s.id}: 2000€ -> 20€`);
            await supabase.from('servicios').update({ amount: 20 }).eq('id', s.id);
        }
    } else {
        console.log('✨ No se encontró el ticket #10547 con 2000€ (quizás ya se arregló o es otro importe).');
    }

    // Buscar otros posibles errores de la serie 10
    const { data: others } = await supabase
        .from('servicios')
        .select('*')
        .ilike('observation', '%Ticket #10%')
        .gt('amount', 400);

    if (others) {
        console.log(`Revisando otros ${others.length} sospechosos de la serie 10...`);
        for (const s of others) {
            const newAmount = s.amount / 100;
            console.log(`⚠️ Serie 10 Corregida: ID ${s.id} | ${s.amount}€ -> ${newAmount}€`);
            await supabase.from('servicios').update({ amount: newAmount }).eq('id', s.id);
        }
    }

    console.log('🏁 Fin reparación.');
}

fixSpecific();
