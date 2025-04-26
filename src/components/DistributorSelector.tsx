import React, { useEffect, useState } from 'react';
import { OrderList } from '../types/order';
import { Option, Select } from '@material-tailwind/react';
import { distributorsStore } from '../store/distributorsStore';
import { Distributor } from '../types/distributor';

interface DistributorSelectorProps {
  order: OrderList;
  setOrder: React.Dispatch<React.SetStateAction<OrderList>>;
  disabled: boolean;
}

const DistributorSelector: React.FC<DistributorSelectorProps> = ({
  order,
  setOrder,
  disabled,
}) => {
  const [isLoading, setIsLoading] = useState(distributorsStore.isLoadingData);
  const [distributors, setDistributors] = useState<Distributor[]>(distributorsStore.distributors);

  useEffect(() => {
    const unsubscribe = distributorsStore.subscribe(() => {
      setIsLoading(distributorsStore.isLoadingData);
      setDistributors(distributorsStore.distributors);
    });

    // Only fetch if not already loaded
    if (!distributorsStore.isInitialized) {
      distributorsStore.fetchDistributors().catch(console.error);
    }

    return unsubscribe;
  }, []);

  const activeDistributors = distributors.filter(d => d.isActive);
  const selectedDistributorId = order?.distributor?.id || '';

  if (isLoading && distributors.length === 0) {
    return (
      <div className="flex flex-col">
        <label htmlFor="distributor" className="text-sm font-medium text-slate-700">
          الموزع
        </label>
        <div className="mt-1 flex items-center justify-center h-10 bg-gray-50 rounded-md">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <label htmlFor="distributor" className="text-sm font-medium text-slate-700">
        الموزع
      </label>
      {/* Hidden input to enforce required validation */}
      <input 
        type="text" 
        value={selectedDistributorId} 
        required 
        onChange={() => {}} // Prevent React warning
        style={{ display: "none" }} 
      />
      <Select
        id="distributor"
        value={selectedDistributorId}
        onChange={(value) => {
          if (!value) return;
          const selectedDistributor = activeDistributors.find(d => d.id === value);
          if (!selectedDistributor) return;
          
          setOrder((prev: OrderList) => ({
            ...prev,
            distributor: {
              id: selectedDistributor.id,
              name: `${selectedDistributor.firstName} ${selectedDistributor.lastName}`,
              phone: selectedDistributor.phone || ''
            }
          }));
        }}
        disabled={disabled}
        label='اختر الموزع'
        className="block w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        placeholder="اختر الموزع"
        onPointerEnterCapture={() => {}}
        onPointerLeaveCapture={() => {}}
      >
        {activeDistributors.length > 0 ? (
          activeDistributors.map(distributor => (
            <Option key={distributor.id} value={distributor.id}>
              {`${distributor.firstName} ${distributor.lastName}`}
            </Option>
          ))
        ) : (
          <Option value="" disabled>
            لا يوجد موزعين نشطين
          </Option>
        )}
      </Select>
    </div>
  );
};

export default DistributorSelector;