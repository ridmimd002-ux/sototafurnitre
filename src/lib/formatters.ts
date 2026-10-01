/**
 * Formats a number to Bangladeshi Taka currency format (e.g. ৳ 1,250)
 */
export const formatBDT = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '৳0';
  return `৳${Math.round(amount).toLocaleString('en-IN')}`;
};

/**
 * Formats ISO date string to readable format
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

/**
 * Validates Bangladesh mobile phone numbers (013, 014, 015, 016, 017, 018, 019 - 11 digits)
 */
export const isValidBDPhone = (phone: string): boolean => {
  const clean = phone.replace(/[\s-]/g, '');
  return /^(?:\+88|88)?(01[3-9]\d{8})$/.test(clean);
};

/**
 * Standardizes BD phone number to 11 digits starting with 01
 */
export const cleanBDPhone = (phone: string): string => {
  const clean = phone.replace(/[\s-]/g, '');
  const match = clean.match(/(01[3-9]\d{8})$/);
  return match ? match[1] : phone;
};

/**
 * Generates an order ID with prefix
 */
export const generateOrderNumber = (): string => {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `SFE-${rand}`;
};
