
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
export const getInitials = (name: string, override?: string): string => {
    if (override) return override.toUpperCase().substring(0, 3);
    if (!name) return '';
    if (name.toLowerCase().includes('marcelo') && name.toLowerCase().includes('ribeiro')) return 'MRS';

    const parts = name.trim().split(/\s+/).filter(p => p.length > 2);
    if (parts.length === 0) return name.substring(0, 1).toUpperCase();
    if (parts.length === 1) return parts[0].substring(0, 3).toUpperCase();

    const initials = [];
    initials.push(parts[0][0]);

    if (parts.length === 2) {
        // For two words, take first of first and first two of last, or 1/1 if short
        initials.push(parts[1][0]);
        if (parts[1].length > 1) initials.push(parts[1][1]);
    } else {
        if (parts.length > 2) {
            initials.push(parts[parts.length - 2][0]);
        }
        initials.push(parts[parts.length - 1][0]);
    }

    return initials.join('').toUpperCase().substring(0, 3);
};

/**
 * Checks if a string is entirely uppercase and is likely not just an acronym.
 * Useful to warn users about typing in ALL CAPS.
 */
export const isSuspiciouslyAllCaps = (text: string): boolean => {
    if (!text || text.length < 5) return false;
    // Check if it has at least some letters
    const hasLetters = /[a-zA-ZáàãâéèêíïóôõöúçñÁÀÃÂÉÈÊÍÏÓÔÕÖÚÇÑ]/.test(text);
    if (!hasLetters) return false;
    
    // Check if there are no lowercase letters at all
    const hasLowercase = /[a-záàãâéèêíïóôõöúçñ]/.test(text);
    return !hasLowercase;
};

/**
 * Converts a string to Title Case, keeping common prepositions in lowercase.
 * Example: "ROGÉRIO DE OLIVEIRA" -> "Rogério de Oliveira"
 */
export const toTitleCase = (text: string): string => {
    if (!text) return '';
    
    const prepositions = ['de', 'da', 'do', 'das', 'dos', 'e', 'em'];
    
    return text.toLowerCase().split(' ').map((word, index) => {
        if (word.length === 0) return word;
        if (index > 0 && prepositions.includes(word)) {
            return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
};
