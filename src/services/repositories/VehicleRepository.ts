import { supabase } from '../../supabase';
import { Vehicle } from '../../types';
import { normalizeUsername } from '../../utils/userHelpers';

export class VehicleRepository {
    private static table = 'vehiculos';

    static async get(userName: string): Promise<Vehicle | null> {
        const uid = normalizeUsername(userName);
        const { data, error } = await supabase
            .from(this.table)
            .select('*')
            .eq('user_id', uid)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return {
            licensePlate: data.license_plate,
            model: data.model,
            initialOdometer: data.initial_odometer,
            maintenance: data.maintenance_data
        };
    }

    static async upsert(vehicle: Vehicle, userName: string): Promise<void> {
        const uid = normalizeUsername(userName);
        const { error } = await supabase
            .from(this.table)
            .upsert({
                license_plate: vehicle.licensePlate,
                model: vehicle.model,
                initial_odometer: vehicle.initialOdometer,
                maintenance_data: vehicle.maintenance,
                user_id: uid,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
    }
}
