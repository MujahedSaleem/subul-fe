import React from 'react';
import { faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Select, Option, Input, Card, CardBody, Typography } from '@material-tailwind/react';
import { Distributor } from '../types/distributor';
import Button from './Button';
import IconButton from './IconButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

interface OrderFilterProps {
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  selectedDistributor: string | null;
  setSelectedDistributor: React.Dispatch<React.SetStateAction<string | null>>;
  dateFrom: string;
  setDateFrom: React.Dispatch<React.SetStateAction<string>>;
  dateTo: string;
  setDateTo: React.Dispatch<React.SetStateAction<string>>;
  resetFilters: () => void;
  activeDistributors: Distributor[];
  selectedStatus: string | null;
  setSelectedStatus: (status: string | null) => void;
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
  selectedStatus,
  setSelectedStatus,
}) => {
  const getSelectedDistributorLabel = () => {
    if (!selectedDistributor) return 'جميع الموزعين';
    const selectedDist = activeDistributors.find(d => d.id === selectedDistributor);
    if (!selectedDist) return 'جميع الموزعين';
    return `${selectedDist.firstName} ${selectedDist.lastName}`;
  };

  const getSelectedStatusLabel = () => {
    if (!selectedStatus) return 'الكل';
    const status = statusOptions.find(s => s.value === selectedStatus);
    return status ? status.label : 'الكل';
  };

  const hasActiveFilters = selectedDistributor || dateFrom || dateTo || selectedStatus;

  const statusOptions = [
    { value: 'New', label: 'جديد' },
    { value: 'Confirmed', label: 'تم التأكيد' },
    { value: 'Pending', label: 'قيد الانتظار' },
    { value: 'Draft', label: 'مسودة' }
  ];

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowFilters(!showFilters)} 
            variant={showFilters ? 'gradient' : 'outlined'} 
            color={showFilters ? 'blue' : 'blue-gray'}
            className="flex items-center gap-2"
          >
            <FontAwesomeIcon icon={showFilters ? faXmark : faFilter} />
            {showFilters ? 'إخفاء الفلتر' : 'إظهار الفلتر'}
          </Button>
          {hasActiveFilters && (
            <Button
              onClick={resetFilters}
              variant="outlined"
              color="red"
              className="flex items-center gap-2"
            >
              <i className="fas fa-times"></i>
              إعادة تعيين
            </Button>
          )}
        </div>
        {hasActiveFilters && (
          <Typography 
            variant="small" 
            color="blue-gray"
            className="font-medium"
            placeholder={undefined}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            {activeDistributors.length} موزع نشط
          </Typography>
        )}
      </div>

      {showFilters && (
        <Card 
          className="w-full"
          placeholder={undefined}
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
        >
          <CardBody 
            className="p-4"
            placeholder={undefined}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Distributor Filter */}
              <div className="space-y-2 md:order-4">
                <Typography 
                  variant="small" 
                  color="blue-gray"
                  className="font-medium"
                  placeholder={undefined}
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                >
                  الموزع
                </Typography>
                <Select
                  value={selectedDistributor || ''}
                  onChange={(e) => {
                    
                    setSelectedDistributor(e || null);
                  }}
                  selected={(element) => {
                    const selectedDist = activeDistributors.find(d => d.id === selectedDistributor);
                    return (
                      <span className="text-right block truncate">
                        {selectedDist ? `${selectedDist.firstName} ${selectedDist.lastName}` : 'جميع الموزعين'}
                      </span>
                    );
                  }}
                  label={getSelectedDistributorLabel()}
                  className="border border-blue-gray-200 rounded-lg leading-tight text-right"
                  labelProps={{
                    className: "text-right before:text-right after:text-right"
                  }}
                  menuProps={{ className: "text-right" }}
                  containerProps={{ className: "min-w-[200px] text-right" }}
                  placeholder={undefined}
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                >
                  <Option value="" className="leading-tight text-right">جميع الموزعين</Option>
                  {activeDistributors.map(d => (
                    <Option key={d.id} value={d.id} className="leading-tight text-right">
                      {`${d.firstName} ${d.lastName}`}
                    </Option>
                  ))}
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2 md:order-3">
                <Typography 
                  variant="small" 
                  color="blue-gray"
                  className="font-medium"
                  placeholder={undefined}
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                >
                  الحالة
                </Typography>
                <Select
                  value={selectedStatus || ''}
                  onChange={(e) => setSelectedStatus(e || null)}
                  selected={(element) => {
                    const status = statusOptions.find(s => s.value === selectedStatus);
                    return (
                      <span className="text-right block truncate">
                        {status ? status.label : 'الكل'}
                      </span>
                    );
                  }}
                  label={getSelectedStatusLabel()}
                  className="border border-blue-gray-200 rounded-lg leading-tight text-right"
                  labelProps={{
                    className: "text-right before:text-right after:text-right"
                  }}
                  menuProps={{ className: "text-right" }}
                  containerProps={{ className: "min-w-[200px] text-right" }}
                  placeholder={undefined}
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                >
                  <Option value="" className="leading-tight text-right">الكل</Option>
                  {statusOptions.map((status) => (
                    <Option key={status.value} value={status.value} className="leading-tight text-right">
                      {status.label}
                    </Option>
                  ))}
                </Select>
              </div>

              {/* Date From Filter */}
              <div className="space-y-2 md:order-2">
                <Typography 
                  variant="small" 
                  color="blue-gray"
                  className="font-medium"
                  placeholder={undefined}
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                >
                  من تاريخ
                </Typography>
                <Input
                  type="datetime-local"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="border border-blue-gray-200 rounded-lg"
                  placeholder={undefined}
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                  crossOrigin={undefined}
                />
              </div>

              {/* Date To Filter */}
              <div className="space-y-2 md:order-1">
                <Typography 
                  variant="small" 
                  color="blue-gray"
                  className="font-medium"
                  placeholder={undefined}
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                >
                  إلى تاريخ
                </Typography>
                <Input
                  type="datetime-local"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="border border-blue-gray-200 rounded-lg"
                  placeholder={undefined}
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                  crossOrigin={undefined}
                />
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default OrderFilter;