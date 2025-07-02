import { faCheckCircle, faHourglassHalf, faCircleCheck, faPencil } from '@fortawesome/free-solid-svg-icons';
import { Customer, Location } from '../types/customer';
import { OrderList } from '../types/order';

/**
 * Status configuration for order status badges and display
 */
export const getOrderStatusConfig = (status: string) => {
  switch (status) {
    case 'Confirmed':
      return {
        icon: faCheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        label: 'تم التأكيد'
      };
    case 'Pending':
      return {
        icon: faHourglassHalf,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        label: 'قيد الانتظار'
      };
    case 'New':
      return {
        icon: faCircleCheck,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        label: 'جديد'
      };
    case 'Draft':
      return {
        icon: faPencil,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        label: 'مسودة'
      };
    default:
      return {
        icon: faCircleCheck,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        label: status
      };
  }
};

/**
 * Format currency amount for display
 */
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'ILS' });
};

/**
 * Clean phone number for direct calling and add country code
 */
export const cleanPhoneNumber = (phone: string): string => {
  const cleaned = phone?.replace(/\D/g, '');
  const withoutLeadingZeros = cleaned?.replace(/^0+/, '');
  
  // Add Israel country code (+972) if not already present
  if (withoutLeadingZeros && !withoutLeadingZeros.startsWith('972')) {
    return `972${withoutLeadingZeros}`;
  }
  
  return withoutLeadingZeros;
};

/**
 * Handle direct phone call with country code
 */
export const handleDirectCall = (phone: string): void => {
  const cleanedPhone = cleanPhoneNumber(phone);
  if (cleanedPhone) {
    window.location.href = `tel:+${cleanedPhone}`;
  }
};

/**
 * Handle opening location in maps
 */
export const handleOpenLocation = (location: Location): void => {
  if (location?.coordinates) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${location.coordinates}`, '_blank');
  }
};

/**
 * Generate unique order number
 */
export const generateOrderNumber = (): string => {
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  return `ORD${timestamp}`;
};

/**
 * Check if all required order fields are filled
 */
export const areAllRequiredFieldsFilled = (order: OrderList): boolean => {
  const hasCustomerName = order.customer?.name?.trim();
  const hasCustomerPhone = order.customer?.phone?.trim();
  const hasLocation = order.location?.name?.trim();
  const hasPrice = order.cost >= 0;

  return !!(hasCustomerName && hasCustomerPhone && hasLocation && hasPrice);
};

/**
 * Get dynamic button title based on order completion status
 */
export const getOrderButtonTitle = (order: OrderList | null, isEdit: boolean = false): string => {
  if (!order) return isEdit ? 'حفظ التغييرات' : 'تأكيد الطلبية';
  
  if (isEdit && order.status === 'Confirmed') {
    return 'حفظ التغييرات';
  }
  
  const allFieldsFilled = areAllRequiredFieldsFilled(order);
  return allFieldsFilled ? 'تأكيد الطلب' : 'حفظ كمسودة';
};

/**
 * Determine target status based on field completion
 */
export const getTargetOrderStatus = (order: OrderList): 'New' | 'Draft' => {
  return areAllRequiredFieldsFilled(order) ? 'New' : 'Draft';
};

/**
 * Find matching location in customer's locations array
 * Handles both new locations (ID 0) and existing locations
 */
export const findMatchingLocation = (
  customerLocations: Location[],
  targetLocation: Location
): Location | undefined => {
  return customerLocations.find(location => {
    if (targetLocation.id === 0) {
      // New location - match by name and coordinates
      return location.name === targetLocation.name && 
             (!targetLocation.coordinates || location.coordinates === targetLocation.coordinates);
    } else {
      // Existing location - match by ID
      return location.id === targetLocation.id;
    }
  });
};

/**
 * Get fallback location (last location in the array)
 */
export const getFallbackLocation = (customerLocations: Location[]): Location | undefined => {
  return customerLocations.length > 0 ? customerLocations[customerLocations.length - 1] : undefined;
}; 