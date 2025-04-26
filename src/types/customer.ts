export interface Location {
  id: number;
  name: string;
  address: string;
  coordinates?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  customerId: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  locations: Location[];
}
export interface DistributorCreateCustomerRequest extends Customer {
  locationName: string;
  coordinates: string;
}