import { Customer, Location } from "./customer";
import { Distributor } from "./distributor";

export interface OrderRequest {
  id: number;
  orderNumber: string;
  customerId?: string;
  locationId: number|undefined;
  cost: number;
  statusString: 'New' | 'Pending' | 'Confirmed' | 'Draft';
  distributorId?: string;
}

export interface DistributorInfo {
  id: string;
  name: string;
  phone: string;
}

export interface OrderList {
  id: number;
  orderNumber: string;
  customer: Customer;
  location: Location;
  distributor: DistributorInfo;
  cost: number;
  status: string;
  createdAt: string;
  confirmedAt: string;
}

export interface PaginatedOrders {
  items: OrderList[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface OrderFilters {
  distributorId?: string | null;
  status?: string | null;
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
}