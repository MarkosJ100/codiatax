import { useApp } from '../context/AppContext';

export const useToast = () => {
    const { showToast } = useApp();

    return {
        success: (message: string) => showToast(message, 'success'),
        error: (message: string) => showToast(message, 'error'),
        info: (message: string) => showToast(message, 'info' as any),
        warning: (message: string) => showToast(message, 'warning' as any),
    };
};
