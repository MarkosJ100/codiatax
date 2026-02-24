import { supabase } from '../../supabase';
import { ShiftStorage } from '../../types';
import { normalizeUsername } from '../../utils/userHelpers';

export class ShiftRepository {
    private static table = 'turnos_storage';

    static async get(userName: string): Promise<ShiftStorage | null> {
        const uid = normalizeUsername(userName);
        const { data, error } = await supabase
            .from(this.table)
            .select('*')
            .eq('user_id', uid)
            .maybeSingle();

        if (error) throw error;
        return data ? data.data_json : null;
    }

    static async upsert(storage: ShiftStorage, userName: string): Promise<void> {
        const uid = normalizeUsername(userName);
        const { error } = await supabase
            .from(this.table)
            .upsert({
                user_id: uid,
                data_json: storage,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
    }
}
