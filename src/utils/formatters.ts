import { digitsArToEn } from "@persian-tools/persian-tools";

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleString('ar-SA');
};

export const formatCurrency = (amount: string | number) => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `$${value.toFixed(2)}`;
};

export const getStatusText = (status: string) => {
  switch (status) {
    case 'New': return 'جديد';
    case 'Pending': return 'قيد الانتظار';
    case 'Draft': return 'مسودة';
    case 'Confirmed': return 'مؤكد';
    case 'Active': return 'نشط';
    case 'Inactive': return 'غير نشط';
    default: return status;
  }
};



export const normalizePhoneNumber = (phone: string): string => {
  // Convert Persian/Arabic digits to English
  phone = digitsArToEn(phone);

  // Remove all non-numeric characters except `+`
  phone = phone.replace(/[^\d+]/g, "");

  // Normalize country codes
  if (phone.startsWith("+970") || phone.startsWith("+972")) {
    phone = "0" + phone.slice(4);
  } else if (phone.startsWith("+")) {
    phone = "0" + phone.slice(1);
  }

  // Ensure the number starts with "0"
  if (!phone.startsWith("0") && phone.length > 0) {
    phone = "0" + phone;
  }

  return phone;
};
export function extractAndNormalizeLocalPhoneNumber(input: string): string | null {
  // Step 1: Remove all non-numeric characters except '+' and Arabic numerals
  const cleanedInput = Array.from(input)
    .map(char => arabicToLatinMap[char] || char) // Convert Arabic numerals to Latin
    .join('')
    .replace(/[^+\d]/g, ''); // Remove all non-numeric characters except '+'

  // Step 2: Extract potential phone numbers using regex
  const phoneRegex = /(\+?\d+)/g; // Matches phone numbers with or without '+'
  const matches = cleanedInput.match(phoneRegex);

  if (!matches || matches.length === 0) {
    return null; // No valid phone number found
  }

  // Step 3: Normalize the extracted phone numbers
  const normalizedNumbers = matches.map(number => {
    // Replace country codes (+970, +972, 970, 972, 00970, 00972) with '0'
    const countryCodes = ['+970', '+972', '970', '972', '00970', '00972'];
    for (const code of countryCodes) {
      if (number.startsWith(code)) {
        number = '0' + number.substring(code.length); // Replace with '0'
        break;
      }
    }
    return number;
  });

  // Step 4: Return the first valid phone number (or null if none are valid)
  const result = normalizedNumbers[0].replace(/\D/g, ''); // Remove any remaining non-digit characters
  return result.length > 0 ? result : null;
}

// Helper function: Map Arabic numerals to Latin numerals
const arabicToLatinMap: { [key: string]: string } = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
};
export const isValidPhoneNumber = (phoneNumber: string) => {
  return /^(09|05|04)\d{7,8}$/.test(phoneNumber)
}

