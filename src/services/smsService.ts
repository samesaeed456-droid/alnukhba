/**
 * SMS Service
 * Centralized service for sending single and bulk SMS messages.
 * Handles phone number cleaning and formatting before sending to the backend.
 */

export const smsService = {
  /**
   * Cleans and formats a phone number for the backend.
   */
  formatPhone(phone: string): string {
    // Remove all non-digit characters
    let clean = phone.replace(/\D/g, '');
    
    // If it starts with 00, remove it
    if (clean.startsWith('00')) {
      clean = clean.substring(2);
    }
    
    // Yemen specific: if it's 9 digits starting with 7, it's likely missing the country code
    if (clean.length === 9 && clean.startsWith('7')) {
      clean = '967' + clean;
    } 
    // If it's 10 digits starting with 07, replace 0 with 967
    else if (clean.length === 10 && clean.startsWith('07')) {
      clean = '967' + clean.substring(1);
    }
    
    return clean;
  },

  /**
   * Sends a single SMS message.
   */
  async sendSingle(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
    if (!phone || !message) return { success: false, error: 'رقم الهاتف والرسالة مطلوبان' };

    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('SMS Service Error:', error);
      return { success: false, error: 'فشل الاتصال بخدمة الرسائل' };
    }
  },

  /**
   * Sends bulk SMS messages using the server-side queue.
   */
  async sendBulk(phones: string[], message: string): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!phones || phones.length === 0 || !message) {
      return { success: false, error: 'قائمة الأرقام والرسالة مطلوبة' };
    }

    try {
      const response = await fetch('/api/send-bulk-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phones, message })
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('SMS Bulk Service Error:', error);
      return { success: false, error: 'فشل الاتصال بخدمة الرسائل الجماعية' };
    }
  }
};
