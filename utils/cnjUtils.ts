
/**
 * Removes all non-numeric characters from a string.
 * Useful for comparing formatted process numbers (CNJ) with raw versions.
 */
export const sanitizeCNJ = (cnj: string): string => {
    if (!cnj) return '';
    return cnj.replace(/\D/g, '');
};
