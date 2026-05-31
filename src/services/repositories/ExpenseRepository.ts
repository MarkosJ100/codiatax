import { supabase } from '../../supabase';
import { Expense } from '../../types';
import { normalizeUsername } from '../../utils/userHelpers';

export class ExpenseRepository {
    private static table = 'gastos';

    static async getAll(userName: string): Promise<Expense[]> {
        const uid = normalizeUsername(userName);
        const { data, error } = await supabase
            .from(this.table)
            .select('*')
            .eq('user_id', uid)
            .order('timestamp', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    static async create(expense: Omit<Expense, 'id'>, userName: string): Promise<Expense> {
        const uid = normalizeUsername(userName);
        const newId = Date.now();
        const { data, error } = await supabase
            .from(this.table)
            .insert([{
                ...expense,
                id: newId,
                user_id: uid
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async update(id: number, updates: Partial<Expense>): Promise<void> {
        const { error } = await supabase
            .from(this.table)
            .update(updates)
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
}
