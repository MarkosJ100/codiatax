import { Toast } from '../types';

export const validators = {
    isPositiveNumber: (value: string | number): boolean => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return !isNaN(num) && num > 0;
    },

    isNonNegativeNumber: (value: string | number): boolean => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return !isNaN(num) && num >= 0;
    },

    isInRange: (value: string | number, min: number, max: number): boolean => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return !isNaN(num) && num >= min && num <= max;
    },

    isNotEmpty: (value: string): boolean => {
        return value.trim().length > 0;
    },

    isValidKilometers: (value: string | number): boolean => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return !isNaN(num) && num > 0 && num < 10000; // Max 10,000 km per day
    },

    isValidAmount: (value: string | number): boolean => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return !isNaN(num) && num >= 0 && num < 100000; // Max 100,000€
    }
};

export const getErrorMessage = (field: string, validationType: string): string => {
    const messages: Record<string, string> = {
        'positive': `${field} debe ser un número positivo`,
        'nonNegative': `${field} no puede ser negativo`,
        'empty': `${field} es obligatorio`,
        'invalidKm': 'Kilometraje inválido (máx. 10,000 km/día)',
        'invalidAmount': 'Importe inválido (máx. 100,000€)',
        'range': `${field} está fuera del rango permitido`
    };
    return messages[validationType] || 'Valor inválido';
};
