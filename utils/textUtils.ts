
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
