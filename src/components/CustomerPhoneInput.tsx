import React from 'react';
import { Customer } from '../types/customer';
import { Input } from '@material-tailwind/react';
import { OrderList } from '../types/order';

interface CustomerPhoneInputProps {
  customer: Customer;
  setOrder: React.Dispatch<React.SetStateAction<OrderList>>;
  disabled: boolean;
}

const CustomerPhoneInput: React.FC<CustomerPhoneInputProps> = ({
  customer,
  setOrder,
  disabled,
}) => {
 

  return (
    <div className="flex flex-col">
      <label htmlFor="phone" className="text-sm font-medium text-slate-700">
        رقم الهاتف
      </label>
      <Input
        type="tel"
        id="phone"
        value={customer?.phone || ''}
        onChange={(e) => setOrder((prev) => ({ ...prev, customer: { phone: e.target.value } as Customer }))}
        className="block w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        placeholder="أدخل رقم الهاتف"
        required={!disabled}
        disabled={disabled}
      />
      {customer?.phone && !/^05\d{8}$/.test(customer?.phone) && (
        <p className="text-red-500 text-sm mt-1">رقم الهاتف يجب أن يكون 10 أرقام ويبدأ بـ 05.</p>
      )}
    </div>
  );
};

export default CustomerPhoneInput;