import { useUI } from '../context/UIContext';

export const useToast = () => {
    const { showToast } = useUI();

    return {
        success: (message: string) => showToast(message, 'success'),
        error: (message: string) => showToast(message, 'error'),
        info: (message: string) => showToast(message, 'info' as any),
        warning: (message: string) => showToast(message, 'warning' as any),
    };
};
