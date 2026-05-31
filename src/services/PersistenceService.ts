import { storage } from '../utils/storage';
import { DataRepository } from './repositories/DataRepository';
import { BackupData } from '../types';

export interface PersistenceResult {
    success: boolean;
    error?: string;
    requiresReload?: boolean;
}

export class PersistenceService {
    /**
     * L €gica de borrado completo de datos (local + nube).
     * No muestra di €logos ni toasts ni recarga la UI.
     * Devuelve un resultado para que la capa de presentaci €n decida qu € hacer.
     */
    static async resetAppData(userName?: string): Promise<PersistenceResult> {
        try {
            storage.clearAll();

            if (userName) {
                await DataRepository.resetAllData(userName);
            }

            return { success: true, requiresReload: true };
        } catch (error) {
            console.error('Failed to reset app data:', error);
            return { success: false, error: 'Error al borrar los datos', requiresReload: false };
        }
    }

    /**
     * Restaura una copia de seguridad en almacenamiento local.
     * No muestra di €logos ni recarga; solo devuelve el resultado.
     */
    static async restoreAppData(backup: BackupData): Promise<PersistenceResult> {
        try {
            if (backup.services) storage.setItem('codiatx_services', backup.services);
            if (backup.expenses) storage.setItem('codiatx_expenses', backup.expenses);
            if (backup.vehicle) storage.setItem('codiatx_vehicle', backup.vehicle);
            if (backup.mileageLogs) storage.setItem('codiatx_mileage', backup.mileageLogs);
            if (backup.shiftStorage) storage.setItem('codiatx_shifts', backup.shiftStorage);
            if (backup.annualConfig) storage.setItem('codiatx_annual_config', backup.annualConfig);

            return { success: true, requiresReload: true };
        } catch (error) {
            console.error('Failed to restore backup:', error);
            return { success: false, error: 'Error al procesar el archivo de backup', requiresReload: false };
        }
    }
}

