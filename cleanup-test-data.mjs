import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanUp() {
    console.log('🧹 Limpiando datos de prueba...');

    const { error } = await supabase
        .from('servicios')
        .delete()
        .ilike('observation', '%Servicio de prueba%');

    if (error) {
        console.error('❌ Error al borrar:', error);
    } else {
        console.log('✅ Datos de prueba eliminados correctamente.');
    }
}

cleanUp();
