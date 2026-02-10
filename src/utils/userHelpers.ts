/**
 * User name normalization utilities
 * Ensures consistent user identification across the app and Supabase
 */

/**
 * Normalizes a username for storage and comparison
 * - Converts to lowercase
 * - Trims whitespace
 * - Ensures consistent formatting
 * 
 * @param name - Raw username input
 * @returns Normalized username
 * 
 * @example
 * normalizeUsername("  Marcos  ") // "marcos"
 * normalizeUsername("JUAN") // "juan"
 */
export const normalizeUsername = (name: string): string => {
    return name.trim().toLowerCase();
};

/**
 * Formats a username for display in the UI
 * Capitalizes the first letter while keeping the rest lowercase
 * 
 * @param name - Username (can be normalized or raw)
 * @returns Formatted username for display
 * 
 * @example
 * displayUsername("marcos") // "Marcos"
 * displayUsername("JUAN") // "Juan"
 */
export const displayUsername = (name: string): string => {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return '';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

/**
 * Compares two usernames ignoring case and whitespace
 * 
 * @param name1 - First username
 * @param name2 - Second username
 * @returns true if usernames are equivalent
 * 
 * @example
 * isSameUser("Marcos", "marcos") // true
 * isSameUser("  Juan  ", "juan") // true
 */
export const isSameUser = (name1: string, name2: string): boolean => {
    return normalizeUsername(name1) === normalizeUsername(name2);
};
