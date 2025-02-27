import React, { useEffect, useState } from 'react';
import { OrderList } from '../types/order';
import { Option, Select } from '@material-tailwind/react';
import { distributorsStore } from '../store/distributorsStore';

interface DistributorSelectorProps {
  order: OrderList;
  setOrder: React.Dispatch<React.SetStateAction<any>>;
  disabled: boolean;
}

const DistributorSelector: React.FC<DistributorSelectorProps> = ({
  order,
  setOrder,
  disabled,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchDistributors = async () => {
      if (!distributorsStore.isLoadingData) {
        setIsLoading(true);
        try {
          console.log('Fetching distributors...');
          await distributorsStore.fetchDistributors();
        } catch (error) {
          console.error("Error fetching distributors:", error);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }
    };

    fetchDistributors();

    return () => {
      isMounted = true;
    };
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }
   const activeDistributors = distributorsStore.distributors.filter(d => d.isActive);

  return (
    <div className="flex flex-col">
      <label htmlFor="distributor" className="text-sm font-medium text-slate-700">
        الموزع
      </label>
        {/* Hidden input to enforce required validation */}
        <input 
                type="text" 
                value={order?.distributor?.id} 
                required 
                onChange={() => {}} // Prevent React warning
                style={{ display: "none" }} 
            />
      <Select
        id="distributor"
        value={order?.distributor?.id || ''}
        onChange={(e) => {
          setOrder(prev => ({
            ...prev,
            distributor: { ...prev.distributor, id: e }
          }));
        }}
        disabled={disabled}
        label='اختر الموزع'
        className="block w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        placeholder={undefined}

      >
        {activeDistributors.map(distributor => (
          <Option key={distributor.id} value={distributor.id}>
            {`${distributor.firstName} ${distributor.lastName}`}
          </Option>
        ))}
        
      </Select>
    </div>
  );
};

export default DistributorSelector;