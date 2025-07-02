import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import CustomerForm from "./CustomerForm";
import { Customer } from "../types/customer";
import { useNavigate } from "react-router-dom";
import { useError } from "../context/ErrorContext";
import { useCustomers } from "../hooks/useCustomers";

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
  const { customers, getCustomerById, updateCustomer, refreshCustomers } = useCustomers();
  
  useEffect(() => {
    const fetchCustomer = async () => {
      const result = await getCustomerById(customerId);
      if (result.payload) {
        setCustomer(result.payload as Customer);
      }
    };
    fetchCustomer();
  }, [customerId, getCustomerById]);

  // Expose methods to parent using ref
  useImperativeHandle(ref, () => ({
    getCustomerData: () => customer,
    saveChanges: async () => {
      if (!customer) return;
      
      try {
        await updateCustomer(customer);
        onCustomerUpdated(customer); // Notify parent component of the update
        onCloseModal(); // Close modal
        refreshCustomers(); // Refresh the customer list
      } catch (error) {
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
    
    try {
      await updateCustomer(customer);
      refreshCustomers(); // Refresh the customer list
      navigate("/admin/customers", { state: { shouldRefresh: true } });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "خطأ في تعديل العميل، حاول مجددًا" });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">تعديل بيانات العميل</h2>
      <CustomerForm
        customer={customer}
        setCustomer={(newCustomer) => {
          if (typeof newCustomer === 'function') {
            setCustomer((prev) => prev ? newCustomer(prev) : null);
          } else {
            setCustomer(newCustomer);
          }
        }}
        onSubmit={handleSubmit}
        showButtons={!onCloseModal}
        title="حفظ التغييرات"
      />
    </div>
  );
});

export default EditCustomer;
