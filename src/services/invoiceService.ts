import { supabase } from '../supabase';
import { Invoice, DriverProfile } from '../types';
import { normalizeUsername } from '../utils/userHelpers';

export const invoiceService = {
    // Driver Profile
    async getProfile(userName: string): Promise<DriverProfile | null> {
        const uid = normalizeUsername(userName);
        const { data, error } = await supabase
            .from('driver_profiles')
            .select('*')
            .eq('user_id', uid)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }

        return {
            userId: data.user_id,
            fullName: data.full_name,
            dni: data.dni,
            nif: data.nif,
            address: data.address,
            licenseNo: data.license_no,
            municipality: data.municipality,
            phone: data.phone,
            email: data.email,
            regime: data.regime
        };
    },

    async saveProfile(userName: string, profile: Omit<DriverProfile, 'userId'>): Promise<boolean> {
        const uid = normalizeUsername(userName);
        const { error } = await supabase
            .from('driver_profiles')
            .upsert({
                user_id: uid,
                full_name: profile.fullName,
                dni: profile.dni,
                nif: profile.nif,
                address: profile.address,
                license_no: profile.licenseNo,
                municipality: profile.municipality,
                phone: profile.phone,
                email: profile.email,
                regime: profile.regime,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error saving profile:', error);
            return false;
        }
        return true;
    },

    // Invoices
    async getInvoices(userName: string): Promise<Invoice[]> {
        const uid = normalizeUsername(userName);
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching invoices:', error);
            return [];
        }

        return data.map(item => ({
            id: item.id,
            userId: item.user_id,
            number: item.number,
            series: item.series,
            dateEmission: item.date_emission,
            dateService: item.date_service,
            origin: item.origin,
            destination: item.destination,
            timeStart: item.time_start,
            timeEnd: item.time_end,
            km: item.km,
            baseAmount: item.base_amount,
            ivaRate: item.iva_rate,
            ivaAmount: item.iva_amount,
            totalAmount: item.total_amount,
            paymentMethod: item.payment_method,
            clientName: item.client_name,
            clientNif: item.client_nif,
            clientAddress: item.client_address,
            clientEmail: item.client_email,
            createdAt: item.created_at
        }));
    },

    async createInvoice(userName: string, invoice: Omit<Invoice, 'id' | 'userId' | 'createdAt'>): Promise<Invoice | null> {
        const uid = normalizeUsername(userName);
        const { data, error } = await supabase
            .from('invoices')
            .insert({
                user_id: uid,
                number: invoice.number,
                series: invoice.series,
                date_emission: invoice.dateEmission,
                date_service: invoice.dateService,
                origin: invoice.origin,
                destination: invoice.destination,
                time_start: invoice.timeStart,
                time_end: invoice.timeEnd,
                km: invoice.km,
                base_amount: invoice.baseAmount,
                iva_rate: invoice.ivaRate,
                iva_amount: invoice.ivaAmount,
                total_amount: invoice.totalAmount,
                payment_method: invoice.paymentMethod,
                client_name: invoice.clientName,
                client_nif: invoice.clientNif,
                client_address: invoice.clientAddress,
                client_email: invoice.clientEmail
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating invoice:', error);
            return null;
        }

        return {
            id: data.id,
            userId: data.user_id,
            number: data.number,
            series: data.series,
            dateEmission: data.date_emission,
            dateService: data.date_service,
            origin: data.origin,
            destination: data.destination,
            timeStart: data.time_start,
            timeEnd: data.time_end,
            km: data.km,
            baseAmount: data.base_amount,
            ivaRate: data.iva_rate,
            ivaAmount: data.iva_amount,
            totalAmount: data.total_amount,
            paymentMethod: data.payment_method,
            clientName: data.client_name,
            clientNif: data.client_nif,
            clientAddress: data.client_address,
            clientEmail: data.client_email,
            createdAt: data.created_at
        };
    },

    async deleteInvoice(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting invoice:', error);
            return false;
        }
        return true;
    },

    async deleteAllInvoices(userName: string): Promise<boolean> {
        const uid = normalizeUsername(userName);
        const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('user_id', uid);

        if (error) {
            console.error('Error deleting all invoices:', error);
            return false;
        }
        return true;
    },

    async getNextInvoiceNumber(userName: string, series: string): Promise<string> {
        const uid = normalizeUsername(userName);
        const year = new Date().getFullYear().toString();

        const { data, error } = await supabase
            .from('invoices')
            .select('number')
            .eq('user_id', uid)
            .eq('series', series)
            .like('number', `${year}/%`)
            .order('number', { ascending: false })
            .limit(1);

        if (error || !data || data.length === 0) {
            return `${year}/001`;
        }

        const lastNumberStr = data[0].number;
        const lastSequence = parseInt(lastNumberStr.split('/')[1]);
        const nextSequence = (lastSequence + 1).toString().padStart(3, '0');

        return `${year}/${nextSequence}`;
    }
};
