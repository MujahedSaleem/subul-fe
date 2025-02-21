import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import DistributorForm from '../../components/DistributorForm';
import { distributorsStore } from '../../store/distributorsStore';
import type { Distributor } from '../../types/distributor';
import { useError } from '../../context/ErrorContext';

const EditDistributor: React.FC = () => {
  const { id } = useParams(); // Get the id as a string
  const navigate = useNavigate();
    const { dispatch } = useError(); // ✅ Use inside a React component
  
  const [distributor, setDistributor] = useState<Partial<Distributor>>({
    id: '',
    firstName: '',
    lastName: '',
    phone: '',
    userName: '', // Assuming you have a userName field
    isActive: true,
  });

  useEffect(() => {
    if (id) {
      // Find the distributor by id (as a string)
      const existingDistributor = distributorsStore.distributors.find(
        (d) => d.id === id
      );

      if (existingDistributor) {
        setDistributor(existingDistributor);
      } else {
        dispatch({ type: "SET_ERROR", payload: "غير موجود" });
        navigate('/admin/distributors'); // Redirect to the distributors list if not found
      }
    }
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Ensure the distributor has an id before updating
      if (!distributor.id) {
        throw new Error('Invalid distributor ID.');
      }

      // Call the store's updateDistributor method
      await distributorsStore.updateDistributor(distributor as Distributor);

      // Redirect to the distributors list after successful update
    } catch  {
      dispatch({ type: "SET_ERROR", payload: "حدث خطأ أثناء تحديث الموزع. يرجى المحاولة لاحقًا" });
      
    }finally{
      navigate('/admin/distributors');

    }
  };

  const handleBack = () => {
    navigate('/admin/distributors');
  };

  return (
    <Layout title="تعديل موزع">
      <DistributorForm
        distributor={distributor}
        setDistributor={setDistributor}
        onSubmit={handleSubmit}
        onBack={handleBack}
        title="حفظ التعديلات"
      />
    </Layout>
  );
};

export default EditDistributor;