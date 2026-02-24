import { ServiceRepository } from './ServiceRepository';
import { ExpenseRepository } from './ExpenseRepository';
import { SubscriberRepository } from './SubscriberRepository';
import { VehicleRepository } from './VehicleRepository';
import { ShiftRepository } from './ShiftRepository';

export class DataRepository {
    static async resetAllData(userName: string): Promise<void> {
        const [services, expenses, subscribers] = await Promise.all([
            ServiceRepository.getAll(userName),
            ExpenseRepository.getAll(userName),
            SubscriberRepository.getAll(userName)
        ]);

        await Promise.all([
            ...services.map(s => ServiceRepository.delete(s.id)),
            ...expenses.map(e => ExpenseRepository.delete(e.id)),
            ...subscribers.map(s => SubscriberRepository.delete(s.id)),
            VehicleRepository.upsert({
                licensePlate: '',
                model: '',
                initialOdometer: 0,
                maintenance: {
                    oil: { name: 'Aceite', lastKm: 0, interval: 15000 },
                    tires: { name: 'Neumáticos', lastKm: 0, interval: 40000 },
                    brakes: { name: 'Frenos', lastKm: 0, interval: 30000 }
                }
            }, userName),
            ShiftRepository.upsert({ assignments: [], restDays: [], userConfigs: [] }, userName)
        ]);
    }

    static async fetchInitialAppData(userName: string) {
        const [services, expenses, vehicle, shiftStorage] = await Promise.all([
            ServiceRepository.getAll(userName),
            ExpenseRepository.getAll(userName),
            VehicleRepository.get(userName),
            ShiftRepository.get(userName)
        ]);

        return { services, expenses, vehicle, shiftStorage };
    }
}
