import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
    console.log('🛠️ Iniciando reparación de importes...');

    // 1. Corregir tickets específicos mencionados por el usuario
    const targetTickets = ['14100', '14101', '14102', '14103', '14104'];

    for (const ticket of targetTickets) {
        console.log(`Checking Ticket #${ticket}...`);
        const { data, error } = await supabase
            .from('servicios')
            .select('*')
            .ilike('observation', `%${ticket}%`);

        if (error) {
            console.error(`Error buscando ticket ${ticket}:`, error.message);
            continue;
        }

        for (const item of (data || [])) {
            if (item.amount >= 100) { // Umbral de seguridad para no dividir importes ya correctos si se re-ejecuta
                const newAmount = item.amount / 100;
                console.log(`⚠️ Ticket #${ticket}: Corrigiendo ${item.amount}€ -> ${newAmount}€`);

                const { error: updateError } = await supabase
                    .from('servicios')
                    .update({ amount: newAmount })
                    .eq('id', item.id);

                if (updateError) {
                    console.error(`❌ Error actualizando ${item.id}:`, updateError.message);
                } else {
                    console.log(`✅ ${item.id} actualizado.`);
                }
            } else {
                console.log(`ℹ️ Ticket #${ticket} (ID: ${item.id}) ya tiene un importe bajo (${item.amount}€), saltando.`);
            }
        }
    }

    // 2. Buscar otros posibles errores de 100x en importaciones de Despacho
    // Buscamos importes > 300€ que suelen ser raros para un servicio urbano de despacho
    console.log('🔍 Buscando otros importes sospechosamente altos en servicios de Despacho...');
    const { data: suspicious, error: sError } = await supabase
        .from('servicios')
        .select('*')
        .ilike('observation', '%Despacho%')
        .gt('amount', 300);

    if (sError) {
        console.error('Error buscando sospechosos:', sError.message);
    } else if (suspicious && suspicious.length > 0) {
        console.log(`Encontrados ${suspicious.length} servicios sospechosos.`);
        for (const s of suspicious) {
            const newAmount = s.amount / 100;
            console.log(`⚠️ Sospechoso ID ${s.id}: ${s.amount}€ -> ${newAmount}€ (${s.observation})`);

            const { error: updateError } = await supabase
                .from('servicios')
                .update({ amount: newAmount })
                .eq('id', s.id);

            if (updateError) {
                console.error(`❌ Error actualizando sospechoso ${s.id}:`, updateError.message);
            } else {
                console.log(`✅ ID ${s.id} actualizado.`);
            }
        }
    } else {
        console.log('✨ No se encontraron más servicios sospechosos.');
    }

    console.log('🏁 Reparación finalizada.');
}

fix();
