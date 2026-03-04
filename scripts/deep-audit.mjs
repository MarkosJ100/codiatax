import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function deepAudit() {
    console.log('🔍 Iniciando auditoría profunda de duplicados...');

    const { data: services, error } = await supabase
        .from('servicios')
        .select('*')
        .eq('user_id', 'marcos')
        .order('timestamp', { ascending: true });

    if (error) {
        console.error('Error fetching services:', error.message);
        return;
    }

    console.log(`Total servicios analizados: ${services.length}`);

    const duplicates = [];
    const processed = new Set();

    for (let i = 0; i < services.length; i++) {
        if (processed.has(services[i].id)) continue;

        const s1 = services[i];
        const d1 = new Date(s1.timestamp);

        for (let j = i + 1; j < services.length; j++) {
            if (processed.has(services[j].id)) continue;

            const s2 = services[j];
            const d2 = new Date(s2.timestamp);

            // Diferencia en milisegundos
            const diffMs = Math.abs(d1.getTime() - d2.getTime());
            const diffMinutes = diffMs / (1000 * 60);

            // Criterios de duplicado difuso:
            // 1. Misma fecha (día) Y mismo importe exacto Y (observación similar O tiempo muy cercano)
            const sameDay = d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate();

            const sameAmount = Math.abs(s1.amount - s2.amount) < 0.01;

            if (sameDay && sameAmount) {
                let isDup = false;

                // Si están a menos de 10 minutos
                if (diffMinutes < 10) {
                    isDup = true;
                }
                // O si la observación contiene el mismo "Ticket #"
                else {
                    const t1 = s1.observation.match(/Ticket #(\d+)/);
                    const t2 = s2.observation.match(/Ticket #(\d+)/);
                    if (t1 && t2 && t1[1] === t2[1]) {
                        isDup = true;
                    }
                }

                if (isDup) {
                    duplicates.push({ s1, s2, diffMinutes });
                    processed.add(s2.id);
                }
            }
        }
    }

    if (duplicates.length === 0) {
        console.log('✅ No se encontraron duplicados difusos.');
    } else {
        console.log(`⚠️ Se encontraron ${duplicates.length} posibles duplicados:`);
        duplicates.forEach(d => {
            console.log(`------------------------------------------------`);
            console.log(`SEP: ${d.diffMinutes.toFixed(1)} min | Amt: ${d.s1.amount}€`);
            console.log(`  1. [${d.s1.id}] ${d.s1.timestamp} | ${d.s1.observation}`);
            console.log(`  2. [${d.s2.id}] ${d.s2.timestamp} | ${d.s2.observation}`);
        });

        console.log('\nComando para borrarlos (IDs de la segunda columna):');
        console.log(`IDs: ${Array.from(processed).join(', ')}`);
    }
}

deepAudit();
