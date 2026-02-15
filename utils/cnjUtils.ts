/**
 * Removes all non-numeric characters from a string.
 * Useful for comparing formatted process numbers (CNJ) with raw versions.
 */
export const sanitizeCNJ = (cnj: string): string => {
    if (!cnj) return '';
    return cnj.replace(/\D/g, '');
};

/**
 * Formats a 20-digit string into CNJ mask (0000000-00.0000.0.00.0000).
 * If the value has letters or is not 20 digits, it remains unformatted.
 */
export const formatCNJ = (value: string): string => {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');

    // Check if it's exactly 20 digits and contains no letters
    if (digits.length === 20 && !/[a-zA-Z]/.test(value)) {
        return digits.replace(
            /(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})/,
            '$1-$2.$3.$4.$5.$6'
        );
    }

    return value;
};
