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

