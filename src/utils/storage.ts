class LocalStorageManager {
    private static instance: LocalStorageManager;
    private maxRetries = 3;

    private constructor() { }

    static getInstance(): LocalStorageManager {
        if (!LocalStorageManager.instance) {
            LocalStorageManager.instance = new LocalStorageManager();
        }
        return LocalStorageManager.instance;
    }

    setItem(key: string, value: any, retryCount = 0): boolean {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error: any) {
            if (error.name === 'QuotaExceededError') {
                console.warn('LocalStorage quota exceeded, attempting cleanup...');
                this.cleanupOldData();

                if (retryCount < this.maxRetries) {
                    return this.setItem(key, value, retryCount + 1);
                }
                console.error('Failed to save data after cleanup');
                return false;
            }
            console.error('LocalStorage error:', error);
            return false;
        }
    }

    getItem<T>(key: string, defaultValue: T): T {
        try {
            const item = localStorage.getItem(key);
            if (!item) return defaultValue;
            return JSON.parse(item) as T;
        } catch (error) {
            console.error(`Error reading ${key} from localStorage:`, error);
            return defaultValue;
        }
    }

    removeItem(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing ${key}:`, error);
        }
    }

    private cleanupOldData(): void {
        try {
            // Remove old services and expenses (keep last 90 days)
            const services = this.getItem<any[]>('codiatax_services', []);
            const expenses = this.getItem<any[]>('codiatax_expenses', []);

            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            const recentServices = services.filter(s =>
                new Date(s.timestamp) > ninetyDaysAgo
            );
            const recentExpenses = expenses.filter(e =>
                new Date(e.timestamp) > ninetyDaysAgo
            );

            this.setItem('codiatax_services', recentServices);
            this.setItem('codiatax_expenses', recentExpenses);
        } catch (error) {
            console.error('Cleanup failed:', error);
        }
    }

    isAvailable(): boolean {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    getUsage(): { used: number; total: number; percentage: number } {
        let used = 0;
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    const value = localStorage.getItem(key);
                    if (value) {
                        used += value.length + key.length;
                    }
                }
            }
        }
        catch (error) {
            console.error('Error calculating storage usage:', error);
        }

        const total = 5 * 1024 * 1024; // 5MB typical limit
        return {
            used,
            total,
            percentage: (used / total) * 100
        };
    }
}

export const storage = LocalStorageManager.getInstance();
