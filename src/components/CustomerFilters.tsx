import React, { useMemo, useCallback } from 'react';
import { Select, Option, Input, Card, CardBody, Typography } from '@material-tailwind/react';
import Button from './Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch } from '../store/hooks';
import { showError } from '../store/slices/notificationSlice';

interface CustomerFiltersProps {
  customerName: string;
  setCustomerName: (value: string) => void;
  customerPhone: string;
  setCustomerPhone: (value: string) => void;
  isActive: boolean | null;
  setIsActive: (value: boolean | null) => void;
  createdAfter: string;
  setCreatedAfter: (value: string) => void;
  createdBefore: string;
  setCreatedBefore: (value: string) => void;
  resetFilters: () => void;
}

const CustomerFilters: React.FC<CustomerFiltersProps> = ({
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
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
    customerName || customerPhone || isActive !== null || createdAfter || createdBefore,
    [customerName, customerPhone, isActive, createdAfter, createdBefore]
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

      <div>
        <Card 
          className="w-full"
          placeholder={undefined}
        >
          <CardBody 
            className="p-3 sm:p-4"
            placeholder={undefined}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
              {/* Customer Name Filter */}
              <div className="space-y-1.5 sm:space-y-2">
                <Typography 
                  variant="small" 
                  color="blue-gray"
                  className="font-medium text-xs sm:text-sm"
                  placeholder={undefined}
                >
                  اسم العميل
                </Typography>
                <Input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="البحث بالاسم..."
                  className="border border-blue-gray-200 rounded-lg !text-right text-sm"
                  containerProps={{
                    className: "w-full"
                  }}
                  labelProps={{
                    className: "text-right"
                  }}
                  crossOrigin={undefined}
                />
              </div>

              {/* Customer Phone Filter */}
              <div className="space-y-1.5 sm:space-y-2">
                <Typography 
                  variant="small" 
                  color="blue-gray"
                  className="font-medium text-xs sm:text-sm"
                  placeholder={undefined}
                >
                  رقم الهاتف
                </Typography>
                <Input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="البحث بالهاتف..."
                  className="border border-blue-gray-200 rounded-lg !text-right text-sm"
                  containerProps={{
                    className: "w-full"
                  }}
                  labelProps={{
                    className: "text-right"
                  }}
                  crossOrigin={undefined}
                />
              </div>

              {/* Status Filter */}
              <div className="space-y-1.5 sm:space-y-2">
                <Typography 
                  variant="small" 
                  color="blue-gray"
                  className="font-medium text-xs sm:text-sm"
                  placeholder={undefined}
                >
                  الحالة
                </Typography>
                <Select
                  value={isActive === null ? '' : isActive.toString()}
                  onChange={handleIsActiveChange}
                  selected={() => selectedStatusElement}
                  label="الحالة"
                  className="border border-blue-gray-200 rounded-lg leading-tight text-right text-sm"
                  labelProps={{
                    className: "text-right before:text-right after:text-right"
                  }}
                  menuProps={{ 
                    className: "text-right",
                    lockScroll: false
                  }}
                  containerProps={{ 
                    className: "w-full text-right"
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
              <div className="space-y-1.5 sm:space-y-2">
                <Typography 
                  variant="small" 
                  color="blue-gray"
                  className="font-medium text-xs sm:text-sm"
                  placeholder={undefined}
                >
                  من تاريخ الإنشاء
                </Typography>
                <Input
                  type="date"
                  value={createdAfter}
                  onChange={handleCreatedAfterChange}
                  className="border border-blue-gray-200 rounded-lg !text-right text-sm"
                  containerProps={{
                    className: "w-full"
                  }}
                  labelProps={{
                    className: "text-right"
                  }}
                  placeholder={undefined}
                  crossOrigin={undefined}
                />
              </div>

              {/* Created Before Filter */}
              <div className="space-y-1.5 sm:space-y-2">
                <Typography 
                  variant="small" 
                  color="blue-gray"
                  className="font-medium text-xs sm:text-sm"
                  placeholder={undefined}
                >
                  إلى تاريخ الإنشاء
                </Typography>
                <Input
                  type="date"
                  value={createdBefore}
                  onChange={handleCreatedBeforeChange}
                  className="border border-blue-gray-200 rounded-lg !text-right text-sm"
                  containerProps={{
                    className: "w-full"
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
      </div>
    </div>
  );
};

export default React.memo(CustomerFilters);