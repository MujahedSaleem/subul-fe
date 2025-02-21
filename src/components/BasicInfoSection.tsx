import React from "react";
import { Customer } from "../types/customer";
import { Input } from "@material-tailwind/react";

interface BasicInfoSectionProps {
  customer: {
    name: string;
    phone: string;
  };
  setCustomer: React.Dispatch<
    React.SetStateAction<Customer>
  >;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  customer,
  setCustomer,
}) => {
  const handleInputChange = (field: keyof typeof customer, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800">معلومات أساسية</h2>
      <div className="space-y-4">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            اسم العميل
          </label>
          <Input
            type="text"
            value={customer.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="block w-full border border-slate-200 rounded-lg py-2 px-3 focus:ring-primary-500/20 focus:border-primary-500"
            required
          />
        </div>

        {/* Phone Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            رقم الهاتف
          </label>
          <Input
            type="tel"
            value={customer.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className="block w-full border border-slate-200 rounded-lg py-2 px-3 focus:ring-primary-500/20 focus:border-primary-500"
            required
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoSection;