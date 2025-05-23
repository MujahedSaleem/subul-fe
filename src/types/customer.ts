export interface Location {
  id: number;
  name: string;
  coordinates: string;
  description: string;
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