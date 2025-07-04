import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Distributor } from '../types/distributor';
import { RootState, AppDispatch } from '../store/store';
import { 
  fetchDistributors, 
  selectDistributors, 
  selectIsLoading 
} from '../store/slices/distributorSlice';

interface DistributorSelectorProps {
  selectedDistributorId: string | null;
  onDistributorChange: (distributorId: string | null) => void;
  placeholder?: string;
  className?: string;
}

const DistributorSelector: React.FC<DistributorSelectorProps> = ({ 
  selectedDistributorId, 
  onDistributorChange, 
  placeholder = "اختر الموزع",
  className = ""
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const distributors = useSelector(selectDistributors);
  const isLoading = useSelector(selectIsLoading);

  useEffect(() => {
    // Fetch distributors when component mounts
    dispatch(fetchDistributors());
  }, [dispatch]);

  const activeDistributors = distributors.filter(d => d.isActive);

  return (
    <select
      value={selectedDistributorId || ''}
      onChange={(e) => onDistributorChange(e.target.value || null)}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      disabled={isLoading}
    >
      <option value="">{isLoading ? 'جاري التحميل...' : placeholder}</option>
      {activeDistributors.map(distributor => (
        <option key={distributor.id} value={distributor.id}>
          {distributor.firstName} {distributor.lastName}
        </option>
      ))}
    </select>
  );
};

export default DistributorSelector;