import CryptoJS from 'crypto-js';

/**
 * Servicio de encriptación para proteger datos sensibles
 * Usa AES-256 para encriptación simétrica
 */
class EncryptionService {
    private static instance: EncryptionService;
    private encryptionKey: string;

    private constructor() {
        // En producción, esta clave debería generarse de forma única por dispositivo
        // y almacenarse de forma segura usando Capacitor SecureStorage
        this.encryptionKey = this.getOrCreateEncryptionKey();
    }

    static getInstance(): EncryptionService {
        if (!EncryptionService.instance) {
            EncryptionService.instance = new EncryptionService();
        }
        return EncryptionService.instance;
    }

    private getOrCreateEncryptionKey(): string {
        // Intentar obtener la clave del dispositivo
        const storedKey = localStorage.getItem('_app_ek');

        if (storedKey) {
            return storedKey;
        }

        // Generar nueva clave única
        const newKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
        localStorage.setItem('_app_ek', newKey);
        return newKey;
    }

    /**
     * Encripta un objeto o string
     */
    encrypt(data: any): string {
        try {
            const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
            const encrypted = CryptoJS.AES.encrypt(jsonString, this.encryptionKey);
            return encrypted.toString();
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    /**
     * Desencripta y retorna el objeto original
     */
    decrypt<T = any>(encryptedData: string): T {
        try {
            const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
            const jsonString = decrypted.toString(CryptoJS.enc.Utf8);

            if (!jsonString) {
                throw new Error('Decryption failed - invalid key or corrupted data');
            }

            try {
                return JSON.parse(jsonString);
            } catch {
                // Si no es JSON, retornar como string
                return jsonString as T;
            }
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt data');
        }
    }

    /**
     * Encripta datos sensibles específicos
     */
    encryptSensitiveData(data: {
        userName?: string;
        licensePlate?: string;
        licenseNumber?: string;
        pin?: string;
    }): string {
        return this.encrypt(data);
    }

    /**
     * Desencripta datos sensibles
     */
    decryptSensitiveData(encryptedData: string): {
        userName?: string;
        licensePlate?: string;
        licenseNumber?: string;
        pin?: string;
    } {
        return this.decrypt(encryptedData);
    }

    /**
     * Hash de contraseña/PIN (one-way)
     */
    hashPassword(password: string): string {
        return CryptoJS.SHA256(password).toString();
    }

    /**
     * Verifica un password contra su hash
     */
    verifyPassword(password: string, hash: string): boolean {
        return this.hashPassword(password) === hash;
    }

    /**
     * Genera un salt aleatorio
     */
    generateSalt(): string {
        return CryptoJS.lib.WordArray.random(128 / 8).toString();
    }

    /**
     * Hash con salt (más seguro)
     */
    hashWithSalt(password: string, salt: string): string {
        return CryptoJS.PBKDF2(password, salt, {
            keySize: 256 / 32,
            iterations: 1000
        }).toString();
    }
}

export const encryption = EncryptionService.getInstance();
