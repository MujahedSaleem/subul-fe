import React, { useMemo, useCallback, useEffect } from 'react';
import { faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Select, Option, Input, Card, CardBody, Typography } from '@material-tailwind/react';
import { Distributor } from '../types/distributor';
import Button from './Button';
import IconButton from './IconButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchOrders } from '../store/slices/orderSlice';
import { RootState } from '../store/store';

interface OrderFilterProps {
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  selectedDistributor: string | null;
  setSelectedDistributor: (value: string | null) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  resetFilters: () => void;
  activeDistributors: Distributor[];
  selectedStatus: string | null;
  setSelectedStatus: (status: string | null) => void;
  currentPage?: number;
  pageSize?: number;
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
  currentPage = 1,
  pageSize = 10,
}) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state: RootState) => state.orders);

  useEffect(() => {
    dispatch(fetchOrders({
      pageNumber: currentPage,
      pageSize,
      filters: {
        distributorId: selectedDistributor,
        status: selectedStatus,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      }
    }));
  }, [dispatch, currentPage, pageSize, selectedDistributor, selectedStatus, dateFrom, dateTo]);

  const statusOptions = useMemo(() => [
    { value: 'New', label: 'جديد' },
    { value: 'Confirmed', label: 'تم التأكيد' },
    { value: 'Pending', label: 'قيد الانتظار' },
    { value: 'Draft', label: 'مسودة' }
  ], []);

  const getSelectedDistributorLabel = useCallback(() => {
    if (!selectedDistributor) return 'جميع الموزعين';
    const selectedDist = activeDistributors.find(d => d.id === selectedDistributor);
    if (!selectedDist) return 'جميع الموزعين';
    return `${selectedDist.firstName} ${selectedDist.lastName}`;
  }, [selectedDistributor, activeDistributors]);

  const getSelectedStatusLabel = useCallback(() => {
    if (!selectedStatus) return 'الكل';
    const status = statusOptions.find(s => s.value === selectedStatus);
    return status ? status.label : 'الكل';
  }, [selectedStatus, statusOptions]);

  const hasActiveFilters = useMemo(() => 
    selectedDistributor || dateFrom || dateTo || selectedStatus,
    [selectedDistributor, dateFrom, dateTo, selectedStatus]
  );

  const handleDistributorChange = useCallback((value: string | undefined) => {
    setSelectedDistributor(value === undefined ? null : value);
  }, [setSelectedDistributor]);

  const handleStatusChange = useCallback((value: string | undefined) => {
    setSelectedStatus(value === undefined ? null : value);
  }, [setSelectedStatus]);

  const handleDateFromChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFrom(e.target.value);
  }, [setDateFrom]);

  const handleDateToChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDateTo(e.target.value);
  }, [setDateTo]);

  const toggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters, setShowFilters]);

  const selectedDistributorElement = useMemo(() => {
    const selectedDist = activeDistributors.find(d => d.id === selectedDistributor);
    return (
      <span className="text-right block truncate">
        {selectedDist ? `${selectedDist.firstName} ${selectedDist.lastName}` : 'جميع الموزعين'}
      </span>
    );
  }, [selectedDistributor, activeDistributors]);

  const selectedStatusElement = useMemo(() => {
    const status = statusOptions.find(s => s.value === selectedStatus);
    return (
      <span className="text-right block truncate">
        {status ? status.label : 'الكل'}
      </span>
    );
  }, [selectedStatus, statusOptions]);

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            onClick={toggleFilters} 
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
              <FontAwesomeIcon icon={faXmark} />
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
            
            
          >
            {activeDistributors.length} موزع نشط
          </Typography>
        )}
      </div>

      {showFilters && (
        <Card 
          className="w-full"
          placeholder={undefined}
          
          
        >
          <CardBody 
            className="p-4"
            placeholder={undefined}
            
            
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Distributor Filter */}
              <div className="space-y-2 md:order-4">
                <Typography 
                  variant="small" 
                  color="blue-gray"
                  className="font-medium"
                  placeholder={undefined}
                  
                  
                >
                  الموزع
                </Typography>
                <Select
                  value={selectedDistributor || ''}
                  onChange={handleDistributorChange}
                  selected={() => selectedDistributorElement}
                  label="الموزع"
                  className="border border-blue-gray-200 rounded-lg leading-tight text-right"
                  labelProps={{
                    className: "text-right before:text-right after:text-right"
                  }}
                  menuProps={{ 
                    className: "text-right",
                    lockScroll: false
                  }}
                  containerProps={{ 
                    className: "min-w-[200px] text-right",
                  }}
                  animate={{
                    mount: { y: 0, scale: 1 },
                    unmount: { y: -25, scale: 0.95 },
                  }}
                  placeholder={undefined}
                  
                  
                >
                  <Option value="" className="leading-tight text-right">جميع الموزعين</Option>
                  {activeDistributors.map(d => (
                    <Option key={d.id} value={d.id} className="leading-tight text-right" disabled={!d.isActive}>
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
                  
                  
                >
                  الحالة
                </Typography>
                <Select
                  value={selectedStatus || ''}
                  onChange={handleStatusChange}
                  selected={() => selectedStatusElement}
                  label="الحالة"
                  className="border border-blue-gray-200 rounded-lg leading-tight text-right"
                  labelProps={{
                    className: "text-right before:text-right after:text-right"
                  }}
                  menuProps={{ 
                    className: "text-right",
                    lockScroll: false
                  }}
                  containerProps={{ 
                    className: "min-w-[200px] text-right"
                  }}
                  animate={{
                    mount: { y: 0, scale: 1 },
                    unmount: { y: -25, scale: 0.95 },
                  }}
                  placeholder={undefined}
                  
                  
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
                  
                  
                >
                  من تاريخ
                </Typography>
                <Input
                  type="datetime-local"
                  value={dateFrom}
                  onChange={handleDateFromChange}
                  className="border border-blue-gray-200 rounded-lg !text-right"
                  containerProps={{
                    className: "min-w-[200px]"
                  }}
                  labelProps={{
                    className: "text-right"
                  }}
                  placeholder={undefined}
                  
                  
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
                  
                  
                >
                  إلى تاريخ
                </Typography>
                <Input
                  type="datetime-local"
                  value={dateTo}
                  onChange={handleDateToChange}
                  className="border border-blue-gray-200 rounded-lg !text-right"
                  containerProps={{
                    className: "min-w-[200px]"
                  }}
                  labelProps={{
                    className: "text-right"
                  }}
                  placeholder={undefined}
                  
                  
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

export default React.memo(OrderFilter);