import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import DistributorForm from '../../components/DistributorForm';
import { distributorsStore } from '../../store/distributorsStore';
import type { Distributor } from '../../types/distributor';

const AddDistributor: React.FC = () => {
  const navigate = useNavigate();

  // Initialize the distributor state with the new userName field
  const [distributor, setDistributor] = useState<Partial<Distributor>>({
    firstName: '',
    lastName: '',
    phone: '',
    userName: '', // New field
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Call the store's addDistributor method
      await distributorsStore.addDistributor(distributor as Omit<Distributor, 'id' | 'createdAt'>);
      navigate('/admin/distributors'); // Redirect after successful addition
    } catch (error) {
      console.error('Failed to add distributor:', error);
      alert('حدث خطأ أثناء إضافة الموزع. يرجى المحاولة لاحقًا.');
    }
  };

  const handleBack = () => {
    navigate('/admin/distributors');
  };

  return (
    <Layout title="إضافة موزع">
      <DistributorForm
        distributor={distributor}
        setDistributor={setDistributor}
        onSubmit={handleSubmit}
        onBack={handleBack}
        title="إضافة موزع"
      />
    </Layout>
  );
};

export default AddDistributor;