/**
 * Utility to convert phone numbers to dummy emails consistently across the app.
 */
export const getAdminDummyEmail = (phone: string, countryCode: string): string => {
  // 1. Remove all non-digits
  const digitsOnly = phone.replace(/\D/g, '');
  const cleanCountry = countryCode.replace(/\D/g, '');
  
  // 2. Remove country code prefix if the user typed it inside the phone field
  let phoneWithoutCountry = digitsOnly;
  if (digitsOnly.startsWith(cleanCountry)) {
    phoneWithoutCountry = digitsOnly.substring(cleanCountry.length);
  }
  
  // 3. Remove leading zero if it exists (e.g., 077 -> 77)
  const normalizedPhone = phoneWithoutCountry.startsWith('0') ? phoneWithoutCountry.substring(1) : phoneWithoutCountry;
  
  // 4. Return consistent dummy email format
  return `${cleanCountry}${normalizedPhone}@elite-store.local`;
};
