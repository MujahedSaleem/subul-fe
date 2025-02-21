import React, { useEffect } from 'react';
import { Customer } from '../types/customer';
import { Input } from '@material-tailwind/react';
import { customersStore } from '../store/customersStore';
import { OrderList } from '../types/order';

interface CustomerNameInputProps {
  customer: Customer;
  setOrder: React.Dispatch<React.SetStateAction<OrderList>>;
  isNewCustomer: boolean;
  disabled: boolean;
}

const CustomerNameInput: React.FC<CustomerNameInputProps> = ({
  customer,
  setOrder,
  isNewCustomer,
  disabled,
}) => {
    useEffect(() => {
      const fetchCustomers = async () => {
        await customersStore.fetchCustomers();
      };
      fetchCustomers();
    }
    , []);
  return (customer?.phone &&
    <div className="flex flex-col">
      <label htmlFor="customerName" className="text-sm font-medium text-slate-700">
        اسم العميل
      </label>
      <Input
        type="text"
        id="customerName"
        value={customer?.name || ''}
        onChange={(e) => setOrder((prev) => ({ ...prev, customer: { ...prev.customer, name: e.target.value } }))}
        className="block w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        placeholder="أدخل اسم العميل الجديد"
        required={isNewCustomer}
        disabled={disabled}
      />
    </div>
  );
};

export default CustomerNameInput;