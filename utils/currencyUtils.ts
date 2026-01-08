/**
 * Formats a number to BRL currency string (e.g., 1234.56 -> R$ 1.234,56).
 */
export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Parses a currency string back to a number (e.g., "1.234,56" -> 1234.56).
 */
export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  // Remove non-numeric characters except comma
  const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
};

/**
 * Applies a currency mask to a raw string for real-time input formatting.
 * Matches common "R$ 1.234,56" pattern.
 */
export const maskCurrency = (value: string): string => {
  // Remove all non-numeric characters
  let cleanValue = value.replace(/\D/g, '');
  
  // Pad with leading zeros if needed to handle cents
  if (cleanValue.length === 0) return '';
  if (cleanValue.length === 1) cleanValue = '00' + cleanValue;
  if (cleanValue.length === 2) cleanValue = '0' + cleanValue;

  const integerPart = cleanValue.slice(0, -2);
  const decimalPart = cleanValue.slice(-2);

  // Format integer part with dots
  const formattedInteger = parseInt(integerPart).toLocaleString('pt-BR');
  
  return `${formattedInteger},${decimalPart}`;
};
