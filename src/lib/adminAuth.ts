/**
 * Utility to convert phone numbers to dummy emails consistently across the app.
 */
export const getAdminDummyEmail = (phone: string, countryCode: string): string => {
  // Remove all non-digits from both phone and country code
  const cleanPhone = phone.replace(/\D/g, '');
  const cleanCountry = countryCode.replace(/\D/g, '');
  
  // Remove leading zero if it exists in the phone number (e.g., 077 -> 77)
  const normalizedPhone = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone;
  
  // Return consistent dummy email format
  return `${cleanCountry}${normalizedPhone}@elite-store.local`;
};
