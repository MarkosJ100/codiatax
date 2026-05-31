import { supabase } from '../../supabase';
import { Subscriber } from '../../types';
import { normalizeUsername } from '../../utils/userHelpers';

export class SubscriberRepository {
    private static table = 'abonados';

    static async getAll(userName: string): Promise<Subscriber[]> {
        const uid = normalizeUsername(userName);
        const { data, error } = await supabase
            .from(this.table)
            .select('*')
            .eq('user_id', uid);

        if (error) throw error;

        return (data || []).map(s => ({
            id: s.id,
            name: s.name,
            officeNumber: s.office_number,
            isCapped: s.is_capped,
            capAmount: s.cap_amount,
            createdAt: s.created_at
        }));
    }

    static async create(subscriber: Omit<Subscriber, 'id' | 'createdAt'>, userName: string): Promise<Subscriber> {
        const uid = normalizeUsername(userName);
        const newId = Date.now().toString();
        const createdAt = new Date().toISOString();
        const { data, error } = await supabase
            .from(this.table)
            .insert([{
                id: newId,
                name: subscriber.name,
                office_number: subscriber.officeNumber,
                is_capped: subscriber.isCapped,
                cap_amount: subscriber.capAmount,
                created_at: createdAt,
                user_id: uid
            }])
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            officeNumber: data.office_number,
            isCapped: data.is_capped,
            capAmount: data.cap_amount,
            createdAt: data.created_at
        };
    }

    static async update(id: string, updates: Partial<Subscriber>): Promise<void> {
        const { error } = await supabase
            .from(this.table)
            .update({
                name: updates.name,
                office_number: updates.officeNumber,
                is_capped: updates.isCapped,
                cap_amount: updates.capAmount
            })
            .eq('id', id);

        if (error) throw error;
    }

    static async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from(this.table)
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
