import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Layout from '../../components/Layout';
import DistributorForm from '../../components/DistributorForm';
import { Distributor } from '../../types/distributor';
import { AppDispatch } from '../../store/store';
import { addDistributor } from '../../store/slices/distributorSlice';

const AddDistributor: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Initialize the distributor state
  const [distributor, setDistributor] = useState<Partial<Distributor>>({
    firstName: '',
    lastName: '',
    phone: '',
    userName: '',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await dispatch(addDistributor(distributor as Omit<Distributor, 'id'>)).unwrap();
      navigate('/admin/distributors');
    } catch (error) {
      console.error('Error adding distributor:', error);
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