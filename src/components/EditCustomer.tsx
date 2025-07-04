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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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

  // Auto-hide error after 6 seconds
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // Expose methods to parent using ref
  useImperativeHandle(ref, () => ({
    getCustomerData: () => customer,
    saveChanges: async () => {
      if (!customer) return;
      setErrorMsg(null);
      const result = await updateCustomer(customer);
      if (result.meta.requestStatus === 'fulfilled') {
        onCustomerUpdated(customer); // Notify parent component of the update
        onCloseModal(); // Close modal
        refreshCustomers(); // Refresh the customer list
      } else {
        setErrorMsg(result.payload as string || '⚠️ خطأ في تعديل العميل، حاول مجددًا.');
      }
    }
  }));

  if (!customer) {
    return <p className="text-center mt-10 text-red-500">⚠️ العميل غير موجود</p>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setErrorMsg(null);
    const result = await updateCustomer(customer);
    if (result.meta.requestStatus === 'fulfilled') {
      refreshCustomers(); // Refresh the customer list
      navigate("/admin/customers", { state: { shouldRefresh: true } });
    } else {
      setErrorMsg(result.payload as string || '⚠️ خطأ في تعديل العميل، حاول مجددًا.');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">تعديل بيانات العميل</h2>
      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative">
          <button
            type="button"
            className="absolute top-1 left-2 text-red-700 hover:text-red-900 text-lg font-bold focus:outline-none"
            onClick={() => setErrorMsg(null)}
            aria-label="إغلاق رسالة الخطأ"
          >
            ×
          </button>
          <div dangerouslySetInnerHTML={{ __html: errorMsg.replace(/\n/g, '<br />') }} />
        </div>
      )}
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
