import { supabase } from '../../supabase';
import { Service } from '../../types';
import { normalizeUsername } from '../../utils/userHelpers';

export class ServiceRepository {
    private static table = 'servicios';

    static async getAll(userName: string): Promise<Service[]> {
        const uid = normalizeUsername(userName);
        const { data, error } = await supabase
            .from(this.table)
            .select('*')
            .eq('user_id', uid)
            .order('timestamp', { ascending: false });

        if (error) throw error;

        return (data || []).map(s => ({
            id: s.id,
            timestamp: s.timestamp,
            amount: s.amount,
            type: s.type,
            companyName: s.company_name,
            observation: s.observation,
            subscriberId: s.subscriber_id
        }));
    }

    static async create(service: Omit<Service, 'id'>, userName: string): Promise<Service> {
        const uid = normalizeUsername(userName);
        const newId = Date.now();
        const { data, error } = await supabase
            .from(this.table)
            .insert([{
                id: newId,
                timestamp: service.timestamp,
                amount: service.amount,
                type: service.type,
                company_name: service.companyName,
                observation: service.observation,
                subscriber_id: service.subscriberId,
                user_id: uid
            }])
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            timestamp: data.timestamp,
            amount: data.amount,
            type: data.type,
            companyName: data.company_name,
            observation: data.observation,
            subscriberId: data.subscriber_id
        };
    }

    static async update(id: number, updates: Partial<Service>, userName: string): Promise<void> {
        const uid = normalizeUsername(userName);
        const { error } = await supabase
            .from(this.table)
            .update({
                timestamp: updates.timestamp,
                amount: updates.amount,
                type: updates.type,
                company_name: updates.companyName,
                observation: updates.observation,
                subscriber_id: updates.subscriberId,
                user_id: uid
            })
            .eq('id', id);

        if (error) throw error;
    }

    static async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from(this.table)
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    static async upsert(service: Service, userName: string): Promise<void> {
        const uid = normalizeUsername(userName);
        const { error } = await supabase
            .from(this.table)
            .upsert({
                id: service.id,
                timestamp: service.timestamp,
                amount: service.amount,
                type: service.type,
                company_name: service.companyName,
                observation: service.observation,
                subscriber_id: service.subscriberId,
                user_id: uid
            });

        if (error) throw error;
    }
}
