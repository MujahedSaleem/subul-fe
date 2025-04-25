import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { customersStore } from "../../store/customersStore";
import type { Customer } from "../../types/customer";
import CustomerForm from "../../components/CustomerForm";
import { useError } from "../../context/ErrorContext";

const AddCustomer: React.FC = () => {
  const navigate = useNavigate();
    const { dispatch } = useError(); // ✅ Use inside a React component
  
  const [customer, setCustomer] = useState<Customer>({
    id: 0, // Backend will assign the correct ID
    name: "",
    phone: "",
    locations: [],
  });

  // Ensure store is populated on mount
  useEffect(() => {
    customersStore.fetchCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    

    const newCustomer = await customersStore.addCustomer(customer);

    if (!newCustomer) {
      dispatch({ type: "SET_ERROR", payload: "خطأ في إضافة العميل، حاول مجددًا" });
    } 
    navigate("/admin/customers");

  };

  return (
    <Layout title="إضافة عميل">
      <CustomerForm customer={customer} setCustomer={setCustomer} onSubmit={handleSubmit} title="إضافة عميل" />
    </Layout>
  );
};

export default AddCustomer;
