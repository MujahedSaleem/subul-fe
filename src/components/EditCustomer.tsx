import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import CustomerForm from "./CustomerForm";
import { customersStore } from "../store/customersStore";
import { Customer } from "../types/customer";
import { useNavigate } from "react-router-dom";
import { useError } from "../context/ErrorContext";

interface EditCustomerProps {
  customerId: string; // Accept customer ID as a prop
  onCustomerUpdated: (customer: Customer) => void; // Callback for updated customer
  onCloseModal: () => void;
}

// Using forwardRef to allow parent components to access methods
const EditCustomer = forwardRef(({ customerId, onCustomerUpdated, onCloseModal }: EditCustomerProps, ref) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const navigate = useNavigate();
      const { dispatch } = useError(); // ✅ Use inside a React component
  
  useEffect(() => {
    const fetchCustomer = async () => {
      await customersStore.fetchCustomers();
      const existingCustomer = customersStore.customers.find(
        (c) => c.id === parseInt(customerId)
      );
      if (existingCustomer) {
        setCustomer({
          id: existingCustomer.id,
          name: existingCustomer.name,
          phone: existingCustomer.phone,
          locations: existingCustomer.locations,
        });
      }
    };
    fetchCustomer();
  }, [customerId]);

  // Expose methods to parent using ref
  useImperativeHandle(ref, () => ({
    getCustomerData: () => customer,
    saveChanges: async () => {
      if (!customer) return;
      
      const success = await customersStore.updateCustomer(customer);
      if (success) {
        onCustomerUpdated(customer); // Notify parent component of the update
        onCloseModal(); // Close modal
      } else {
        alert("⚠️ خطأ في تعديل العميل، حاول مجددًا.");
      }
    }
  }));

  if (!customer) {
    return <p className="text-center mt-10 text-red-500">⚠️ العميل غير موجود</p>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    
    const success = await customersStore.updateCustomer(customer);
    if (!success) {
      dispatch({ type: "SET_ERROR", payload: "خطأ في تعديل العميل، حاول مجددًا" });
      
    }
    navigate("/admin/customers");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">تعديل بيانات العميل</h2>
      <CustomerForm
        customer={customer}
        setCustomer={setCustomer}
        onSubmit={handleSubmit}
        showButtons={!onCloseModal}
        title="حفظ التغييرات"
      />
    </div>
  );
});

export default EditCustomer;
