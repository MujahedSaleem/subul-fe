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

// New types for backend API requests
export interface UpdateLocationRequest {
  Id?: number;
  Name: string;
  Coordinates: string;
  Description: string;
}

export interface UpdateCustomerRequest {
  Name: string;
  Phone: string;
  IsActive: boolean;
  Locations: UpdateLocationRequest[];
}