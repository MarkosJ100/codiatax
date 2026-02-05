import { encryption } from '../services/encryption';

/**
 * Gestor de almacenamiento seguro con encriptación
 */
class SecureStorageManager {
    private static instance: SecureStorageManager;

    private constructor() { }

    static getInstance(): SecureStorageManager {
        if (!SecureStorageManager.instance) {
            SecureStorageManager.instance = new SecureStorageManager();
        }
        return SecureStorageManager.instance;
    }

    /**
     * Guarda datos encriptados
     */
    setSecureItem(key: string, value: any): boolean {
        try {
            const encrypted = encryption.encrypt(value);
            localStorage.setItem(key, encrypted);
            return true;
        } catch (error) {
            console.error(`Error saving secure item ${key}:`, error);
            return false;
        }
    }

    /**
     * Lee datos encriptados
     */
    getSecureItem<T>(key: string, defaultValue: T): T {
        try {
            const encrypted = localStorage.getItem(key);
            if (!encrypted) return defaultValue;

            return encryption.decrypt<T>(encrypted);
        } catch (error) {
            console.error(`Error reading secure item ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Elimina item seguro
     */
    removeSecureItem(key: string): void {
        localStorage.removeItem(key);
    }

    /**
     * Verifica si existe un item
     */
    hasSecureItem(key: string): boolean {
        return localStorage.getItem(key) !== null;
    }

    /**
     * Migra datos no encriptados a formato encriptado
     */
    migrateToEncrypted(key: string): boolean {
        try {
            const plainData = localStorage.getItem(key);
            if (!plainData) return false;

            // Intentar parsear como JSON
            let data;
            try {
                data = JSON.parse(plainData);
            } catch {
                data = plainData;
            }

            // Guardar encriptado
            return this.setSecureItem(key, data);
        } catch (error) {
            console.error(`Error migrating ${key}:`, error);
            return false;
        }
    }
}

export const secureStorage = SecureStorageManager.getInstance();
