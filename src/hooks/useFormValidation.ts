import { useState, useCallback } from 'react';
import { validators, getErrorMessage } from '../utils/validators';

interface ValidationRule {
    validator: (value: any) => boolean;
    message: string;
}

interface ValidationRules {
    [key: string]: ValidationRule[];
}

export const useFormValidation = (rules: ValidationRules) => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const validate = useCallback((field: string, value: any): boolean => {
        const fieldRules = rules[field];
        if (!fieldRules) return true;

        for (const rule of fieldRules) {
            if (!rule.validator(value)) {
                setErrors(prev => ({ ...prev, [field]: rule.message }));
                return false;
            }
        }

        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
        return true;
    }, [rules]);

    const validateAll = useCallback((values: Record<string, any>): boolean => {
        let isValid = true;
        const newErrors: Record<string, string> = {};

        Object.keys(rules).forEach(field => {
            const fieldRules = rules[field];
            const value = values[field];

            for (const rule of fieldRules) {
                if (!rule.validator(value)) {
                    newErrors[field] = rule.message;
                    isValid = false;
                    break;
                }
            }
        });

        setErrors(newErrors);
        return isValid;
    }, [rules]);

    const handleBlur = useCallback((field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    }, []);

    const resetValidation = useCallback(() => {
        setErrors({});
        setTouched({});
    }, []);

    return {
        errors,
        touched,
        validate,
        validateAll,
        handleBlur,
        resetValidation,
        hasError: (field: string) => touched[field] && !!errors[field],
        getError: (field: string) => touched[field] ? errors[field] : undefined
    };
};
