import React from "react";
import Layout from "../../components/Layout";
import EditCustomer from "../../components/EditCustomer";
import { useParams } from "react-router-dom";

const EditCustomerPage: React.FC = () => {
  const { id } = useParams();

  const handleCustomerUpdated = (updatedCustomer: any) => {
    
    // Optionally navigate back to the customer list or perform other actions
  };

  return (
    <Layout title="تعديل العميل">
      <EditCustomer customerId={id || ""} onCustomerUpdated={handleCustomerUpdated} />
    </Layout>
  );
};

export default EditCustomerPage;