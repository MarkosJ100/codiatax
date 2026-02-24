#!/usr/bin/env node

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Credenciales de Supabase no encontradas en .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('\n=== Verificando Tablas de Facturación ===\n');

    // 1. Verificar driver_profiles
    console.log('🔍 Comprobando tabla "driver_profiles"...');
    const { count: profilesCount, error: errorProfiles } = await supabase
        .from('driver_profiles')
        .select('*', { count: 'exact', head: true });

    if (errorProfiles) {
        if (errorProfiles.code === 'PGRST116' || errorProfiles.message.includes('not found')) {
            console.error('❌ La tabla "driver_profiles" NO EXISTE.');
        } else {
            console.error('⚠️ Error al acceder a "driver_profiles":', errorProfiles.message);
        }
    } else {
        console.log(`✅ Tabla "driver_profiles" existe. Registros: ${profilesCount}`);
    }

    console.log('\n---\n');

    // 2. Verificar invoices
    console.log('🔍 Comprobando tabla "invoices"...');
    const { count: invoicesCount, error: errorInvoices } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true });

    if (errorInvoices) {
        if (errorInvoices.code === '42P01' || errorInvoices.message.includes('not found')) {
            console.error('❌ La tabla "invoices" NO EXISTE.');
        } else {
            console.error('⚠️ Error al acceder a "invoices":', errorInvoices.message);
        }
    } else {
        console.log(`✅ Tabla "invoices" existe. Registros: ${invoicesCount}`);
    }

    console.log('\n');
}

checkTables();
