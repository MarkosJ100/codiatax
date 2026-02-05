/**
 * Utilidades de sanitización y validación de datos
 */

/**
 * Sanitiza un string para prevenir XSS
 */
export const sanitizeString = (input: string): string => {
    if (typeof input !== 'string') return '';

    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

/**
 * Sanitiza HTML removiendo tags peligrosos
 */
export const sanitizeHTML = (html: string): string => {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
};

/**
 * Valida que un número esté en el rango esperado
 */
export const validateNumberRange = (value: number, min: number, max: number): boolean => {
    return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
};

/**
 * Valida formato de fecha
 */
export const validateDateFormat = (dateString: string): boolean => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Limpia y valida input numérico
 */
export const sanitizeNumber = (input: any): number | null => {
    const num = parseFloat(input);
    if (isNaN(num) || !isFinite(num)) return null;
    return num;
};

/**
 * Valida estructura de objeto
 */
export const validateObjectStructure = <T extends object>(
    obj: any,
    requiredKeys: (keyof T)[]
): obj is T => {
    if (typeof obj !== 'object' || obj === null) return false;

    return requiredKeys.every(key => key in obj);
};

/**
 * Rate limiter simple
 */
class RateLimiter {
    private attempts: Map<string, number[]> = new Map();

    /**
     * Verifica si una acción puede ejecutarse
     * @param key Identificador de la acción
     * @param maxAttempts Máximo de intentos permitidos
     * @param windowMs Ventana de tiempo en ms
     */
    canProceed(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
        const now = Date.now();
        const attempts = this.attempts.get(key) || [];

        // Filtrar intentos dentro de la ventana
        const recentAttempts = attempts.filter(time => now - time < windowMs);

        if (recentAttempts.length >= maxAttempts) {
            return false;
        }

        // Registrar nuevo intento
        recentAttempts.push(now);
        this.attempts.set(key, recentAttempts);

        return true;
    }

    /**
     * Resetea el contador para una clave
     */
    reset(key: string): void {
        this.attempts.delete(key);
    }

    /**
     * Obtiene tiempo restante de bloqueo en ms
     */
    getTimeUntilReset(key: string, windowMs: number = 60000): number {
        const attempts = this.attempts.get(key) || [];
        if (attempts.length === 0) return 0;

        const oldestAttempt = Math.min(...attempts);
        const timeElapsed = Date.now() - oldestAttempt;
        const timeRemaining = windowMs - timeElapsed;

        return Math.max(0, timeRemaining);
    }
}

export const rateLimiter = new RateLimiter();

/**
 * Valida y sanitiza datos de servicio
 */
export const validateServiceData = (data: any): boolean => {
    if (!validateObjectStructure(data, ['type', 'amount', 'timestamp'])) {
        return false;
    }

    if (!['normal', 'company'].includes(data.type)) {
        return false;
    }

    const amount = sanitizeNumber(data.amount);
    if (amount === null || amount < 0 || amount > 100000) {
        return false;
    }

    if (!validateDateFormat(data.timestamp)) {
        return false;
    }

    return true;
};

/**
 * Valida y sanitiza datos de gasto
 */
export const validateExpenseData = (data: any): boolean => {
    if (!validateObjectStructure(data, ['category', 'amount', 'timestamp', 'description'])) {
        return false;
    }

    const amount = sanitizeNumber(data.amount);
    if (amount === null || amount < 0 || amount > 100000) {
        return false;
    }

    if (!validateDateFormat(data.timestamp)) {
        return false;
    }

    return true;
};
