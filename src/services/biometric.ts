/**
 * Biometric Service - DISABLED VERSION
 * Plugin removed to allow APK compilation
 * All methods return false/unavailable
 */

export interface BiometricInfo {
    isAvailable: boolean;
    biometryType: 'none' | 'fingerprint' | 'face' | 'iris';
    strongBiometryIsAvailable: boolean;
}

class BiometricService {
    async isAvailable(): Promise<boolean> {
        return false;
    }

    async getBiometryType(): Promise<'none' | 'fingerprint' | 'face' | 'iris'> {
        return 'none';
    }

    async authenticate(reason: string = 'Autenticación requerida'): Promise<boolean> {
        return false;
    }

    async checkBiometryEnrolled(): Promise<boolean> {
        return false;
    }

    async getBiometricInfo(): Promise<BiometricInfo> {
        return {
            isAvailable: false,
            biometryType: 'none',
            strongBiometryIsAvailable: false
        };
    }
}

export const biometricService = new BiometricService();
