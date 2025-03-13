import React from 'react';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { Select, Option, Input } from '@material-tailwind/react';
import { Distributor } from '../types/distributor';
import Button from './Button';

interface OrderFilterProps {
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  selectedDistributor: string;
  setSelectedDistributor: React.Dispatch<React.SetStateAction<string>>;
  dateFrom: string;
  setDateFrom: React.Dispatch<React.SetStateAction<string>>;
  dateTo: string;
  setDateTo: React.Dispatch<React.SetStateAction<string>>;
  resetFilters: () => void;
  activeDistributors: Distributor[];
}

const OrderFilter: React.FC<OrderFilterProps> = ({
  showFilters,
  setShowFilters,
  selectedDistributor,
  setSelectedDistributor,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  resetFilters,
  activeDistributors,
}) => {
 const  getSelectedDistributor = (id: string) => {
  console.log(id)
  if (!selectedDistributor)
    return ''
  const selectedDist = activeDistributors.find(d =>d.id === id)
  if(!selectedDist)
    return ''
  return `${selectedDist.firstName} ${selectedDist.lastName}`
 }
  return (
    <div dir="rtl">
      <Button onClick={() => setShowFilters(!showFilters)} variant={showFilters ? 'success' : 'secondary'} icon={faFilter}>
        {showFilters ? 'إخفاء الفلتر' : 'إظهار الفلتر'}
      </Button>
      {showFilters && (
        <>
        <div className="flex flex-wrap sm:items-center sm:justify-between gap-4 mt-4">
          {/* Distributor Filter */}
          <Select
            value={selectedDistributor}
            onChange={e => setSelectedDistributor(e)}
            className="border border-blue-gray-200 rounded-lg px-3 py-2  mb-2"
            label="الموزع"
          >
            <Option value="">جميع الموزعين</Option>
            {activeDistributors.map(d => (
              <Option key={d.id} value={d.id.toString()}>
                {`${d.firstName} ${d.lastName}`}
              </Option>
            ))}
          </Select>
          {/* Date From Filter */}
          <Input
            type="datetime-local"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className=" mb-2"
            label="من تاريخ"
          />
          {/* Date To Filter */}
          <Input
            type="datetime-local"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className=" mb-2"
            label="إلى تاريخ"
          />
          {/* Reset Button */}
          <Button onClick={resetFilters} variant="danger">
            إعادة تعيين
          </Button>
        </div>
      
          </>
        
      )}
    </div>
  );
};

export default OrderFilter;