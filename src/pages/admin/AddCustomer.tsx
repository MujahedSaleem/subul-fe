import { useNavigate } from "react-router-dom";
import CustomerForm from "../../components/CustomerForm";
import { useCustomers } from "../../hooks/useCustomers";
import { Customer } from "../../types/customer";
import Layout from '../../components/Layout';
import { useEffect, useState } from "react";

const AddCustomer: React.FC = () => {
  const navigate = useNavigate();
  const { addCustomer, fetchCustomers } = useCustomers();
  const [customer, setCustomer] = useState<Customer>({
    id: '', // Will be assigned by backend
    name: '',
    phone: '',
    locations: [],
  });

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await addCustomer(customer);
      if (result.meta.requestStatus === 'fulfilled') {
        navigate('/admin/customers');
      } else {
        console.error('Failed to add customer:', result.payload);
      }
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  return (
    <Layout title="إضافة عميل جديد">
      <CustomerForm 
        customer={customer}
        setCustomer={setCustomer}
        onSubmit={handleSubmit}
        title="إضافة عميل"
      />
    </Layout>
  );
};

export default AddCustomer;
