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
export interface OrderList
  {
    id: number;
    orderNumber: string;
    customer: Customer;
    location: Location;
    distributor: Distributor;
    cost: number;
    status: string
    createdAt: string;
    confirmedAt: string

}