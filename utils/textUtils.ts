
/**
 * Normalizes text for search by removing accents and converting to lowercase.
 * @param text The text to normalize.
 * @returns The normalized text.
 */
export const normalizeText = (text: string): string => {
    if (!text) return '';
    return text
        .normalize('NFD') // Decompose combined characters (e.g., 'á' -> 'a' + '´')
        .replace(/[\u0300-\u036f]/g, '') // Remove the accent marks
        .toLowerCase();
};
/**
 * Generates uppercase initials (up to 3 letters) from a full name.
 * Filters out common Portuguese prepositions (de, da, do).
 * @param name The full name.
 * @returns The generated initials.
 */
export const getInitials = (name: string): string => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/).filter(p => p.length > 2);
    if (parts.length === 0) return name.substring(0, 1).toUpperCase();
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();

    const initials = [];
    initials.push(parts[0][0]);
    if (parts.length > 2) {
        initials.push(parts[parts.length - 2][0]);
    }
    initials.push(parts[parts.length - 1][0]);

    return initials.join('').toUpperCase().substring(0, 3);
};
