import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Layout from '../../components/Layout';
import DistributorForm from '../../components/DistributorForm';
import { Distributor } from '../../types/distributor';
import { RootState, AppDispatch } from '../../store/store';
import { 
  fetchDistributors, 
  updateDistributor, 
  selectDistributors, 
  selectIsLoading 
} from '../../store/slices/distributorSlice';
import { showError } from '../../store/slices/notificationSlice';

const EditDistributor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const distributors = useSelector(selectDistributors);
  const isLoading = useSelector(selectIsLoading);
  
  // Local state
  const [distributor, setDistributor] = useState<Partial<Distributor>>({
    firstName: '',
    lastName: '',
    phone: '',
    userName: '',
    isActive: true,
  });
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    // Fetch distributors if not already loaded
    if (distributors.length === 0 && !isLoading) {
      dispatch(fetchDistributors());
    }
  }, [dispatch, distributors.length, isLoading]);

  useEffect(() => {
    // Find and set the distributor data when distributors are loaded
    if (distributors.length > 0 && id && !initialLoadComplete) {
      const existingDistributor = distributors.find(d => d.id === id);
      if (existingDistributor) {
        setDistributor(existingDistributor);
        setInitialLoadComplete(true);
      }
    }
  }, [distributors, id, initialLoadComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      dispatch(showError({message: 'معرف الموزع مفقود'}));
      return;
    }

    try {
      await dispatch(updateDistributor({ ...distributor, id } as Distributor)).unwrap();
      navigate('/admin/distributors');
    } catch (error) {
      console.error('Error updating distributor:', error);
      dispatch(showError({message: 'حدث خطأ أثناء تحديث الموزع. يرجى المحاولة لاحقًا.'}));
    }
  };

  const handleBack = () => {
    navigate('/admin/distributors');
  };

  if (isLoading || !initialLoadComplete) {
    return (
      <Layout title="تعديل موزع">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">جاري التحميل...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!distributor.id) {
    return (
      <Layout title="تعديل موزع">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-8">
            <p className="text-red-600">الموزع غير موجود</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="تعديل موزع">
      <DistributorForm
        distributor={distributor}
        setDistributor={setDistributor}
        onSubmit={handleSubmit}
        onBack={handleBack}
        title="تعديل موزع"
      />
    </Layout>
  );
};

export default EditDistributor;