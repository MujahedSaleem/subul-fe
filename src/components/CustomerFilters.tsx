import React, { useMemo, useCallback } from 'react';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { Select, Option, Input, Card, CardBody, Typography } from '@material-tailwind/react';
import Button from './Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch } from '../store/hooks';
import { showError } from '../store/slices/notificationSlice';

interface CustomerFiltersProps {
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  customerName: string;
  setCustomerName: (value: string) => void;
  isActive: boolean | null;
  setIsActive: (value: boolean | null) => void;
  createdAfter: string;
  setCreatedAfter: (value: string) => void;
  createdBefore: string;
  setCreatedBefore: (value: string) => void;
  resetFilters: () => void;
}

const CustomerFilters: React.FC<CustomerFiltersProps> = ({
  showFilters,
  setShowFilters,
  customerName,
  setCustomerName,
  isActive,
  setIsActive,
  createdAfter,
  setCreatedAfter,
  createdBefore,
  setCreatedBefore,
  resetFilters,
}) => {
  const dispatch = useAppDispatch();

  const statusOptions = useMemo(() => [
    { value: true, label: 'نشط' },
    { value: false, label: 'غير نشط' }
  ], []);

  const hasActiveFilters = useMemo(() => 
    customerName || isActive !== null || createdAfter || createdBefore,
    [customerName, isActive, createdAfter, createdBefore]
  );

  const handleIsActiveChange = useCallback((value: string | undefined) => {
    if (value === undefined || value === '') {
      setIsActive(null);
    } else {
      setIsActive(value === 'true');
    }
  }, [setIsActive]);

  const handleCreatedAfterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newCreatedAfter = e.target.value;
    if (createdBefore && newCreatedAfter && new Date(newCreatedAfter) > new Date(createdBefore)) {
      dispatch(showError({message: 'تاريخ البداية يجب أن يكون أصغر من أو يساوي تاريخ النهاية'}));
      return;
    }
    setCreatedAfter(newCreatedAfter);
  }, [createdBefore, setCreatedAfter, dispatch]);

  const handleCreatedBeforeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newCreatedBefore = e.target.value;
    if (createdAfter && newCreatedBefore && new Date(newCreatedBefore) < new Date(createdAfter)) {
      dispatch(showError({message: 'تاريخ النهاية يجب أن يكون أكبر من أو يساوي تاريخ البداية'}));
      return;
    }
    setCreatedBefore(newCreatedBefore);
  }, [createdAfter, setCreatedBefore, dispatch]);

  const toggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters, setShowFilters]);

  const selectedStatusElement = useMemo(() => {
    const status = statusOptions.find(s => s.value === isActive);
    return (
      <span className="text-right block truncate">
        {status ? status.label : 'الكل'}
      </span>
    );
  }, [isActive, statusOptions]);

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
              {/* Customer Name Filter */}
              <div className="space-y-2 md:order-1">
                <Typography 
                  variant="small" 
                  color="blue-gray"
                  className="font-medium"
                  placeholder={undefined}
                >
                  اسم العميل
                </Typography>
                <Input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="البحث بالاسم..."
                  className="border border-blue-gray-200 rounded-lg !text-right"
                  containerProps={{
                    className: "min-w-[200px]"
                  }}
                  labelProps={{
                    className: "text-right"
                  }}
                  crossOrigin={undefined}
                />
              </div>

              {/* Status Filter */}
              <div className="space-y-2 md:order-2">
                <Typography 
                  variant="small" 
                  color="blue-gray"
                  className="font-medium"
                  placeholder={undefined}
                >
                  الحالة
                </Typography>
                <Select
                  value={isActive === null ? '' : isActive.toString()}
                  onChange={handleIsActiveChange}
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
                    <Option key={status.value.toString()} value={status.value.toString()} className="leading-tight text-right">
                      {status.label}
                    </Option>
                  ))}
                </Select>
              </div>

              {/* Created After Filter */}
              <div className="space-y-2 md:order-3">
                <Typography 
                  variant="small" 
                  color="blue-gray"
                  className="font-medium"
                  placeholder={undefined}
                >
                  من تاريخ الإنشاء
                </Typography>
                <Input
                  type="date"
                  value={createdAfter}
                  onChange={handleCreatedAfterChange}
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

              {/* Created Before Filter */}
              <div className="space-y-2 md:order-4">
                <Typography 
                  variant="small" 
                  color="blue-gray"
                  className="font-medium"
                  placeholder={undefined}
                >
                  إلى تاريخ الإنشاء
                </Typography>
                <Input
                  type="date"
                  value={createdBefore}
                  onChange={handleCreatedBeforeChange}
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

export default React.memo(CustomerFilters);