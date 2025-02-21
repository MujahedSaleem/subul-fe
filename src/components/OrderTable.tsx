import React from 'react';
import { faPhone, faLocationDot, faCircleCheck, faTrash, faPenToSquare, faEye } from '@fortawesome/free-solid-svg-icons';
import { Card, CardBody, CardFooter, CardHeader, Typography } from '@material-tailwind/react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { ordersStore } from '../store/ordersStore';
import { OrderList } from '../types/order';
import { Customer } from '../types/customer';
import IconButton from './IconButton';

interface OrderTableProps {
  orders: OrderList[];
  handleDelete: (id: number) => void;
  handleConfirmOrder: (order: OrderList) => void;
  handleCallCustomer: (customer: Customer) => void;
  handleOpenLocation: (location: Location) => void;
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
}

const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  handleDelete,
  handleConfirmOrder,
  handleCallCustomer,
  handleOpenLocation,
  formatDate,
  formatCurrency,
}) => {
  const navigate = useNavigate();

  return (
    <Card className='my-10'>
    
      <CardBody className="overflow-x-auto">
        <table className="w-full min-w-max table-auto text-left">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-blue-gray-50 text-slate-500 font-normal leading-normal tracking-normal text-base border-b border-blue-gray-50 text-capitalize">
                الإجراءات
              </th>
              <th className="px-6 py-3 bg-blue-gray-50 text-slate-500 font-normal leading-normal tracking-normal text-base border-b border-blue-gray-50 text-capitalize">
                العميل
              </th>
              <th className="px-6 py-3 bg-blue-gray-50 text-slate-500 font-medium leading-normal tracking-normal text-base border-b border-blue-gray-50 text-capitalize hidden md:table-cell">
                رقم الطلب
              </th>
              <th className="px-6 py-3 bg-blue-gray-50 text-slate-500 font-normal leading-normal tracking-normal text-base border-b border-blue-gray-50 text-capitalize hidden md:table-cell">
                الموقع
              </th>
              <th className="px-6 py-3 bg-blue-gray-50 text-slate-500 font-normal leading-normal tracking-normal text-base border-b border-blue-gray-50 text-capitalize">
                التكلفة
              </th>
              <th className="px-6 py-3 bg-blue-gray-50 text-slate-500 font-normal leading-normal tracking-normal text-base border-b border-blue-gray-50 text-capitalize hidden md:table-cell">
                الموزع
              </th>
              <th className="px-6 py-3 bg-blue-gray-50 text-slate-500 font-normal leading-normal tracking-normal text-base border-b border-blue-gray-50 text-capitalize hidden md:table-cell">
                الحالة
              </th>
              <th className="px-6 py-3 bg-blue-gray-50 text-slate-500 font-normal leading-normal tracking-normal text-base border-b border-blue-gray-50 text-capitalize hidden md:table-cell">
                تاريخ التأكيد
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-b border-blue-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {/* Actions */}
                    <IconButton
                      icon={faPhone}
                      onClick={() => handleCallCustomer(order.customer)}
                      title="اتصال بالعميل"
                    />
                    {order.location?.coordinates && (
                      <IconButton
                        icon={faLocationDot}
                        onClick={() => handleOpenLocation(order.location)}
                        title="فتح الموقع"
                      />
                    )}
                    <IconButton
                      icon={order.status === 'Confirmed' ? faEye : faPenToSquare}
                      onClick={() => navigate(`/admin/orders/edit/${order.id}`)}
                      title={order.status === 'Confirmed' ? 'عرض' : 'تعديل'}
                    />
                    {order.status !== 'Confirmed' && (
                      <>
                        <IconButton
                          icon={faCircleCheck}
                          onClick={() => handleConfirmOrder(order)}
                          title="تأكيد الطلب"
                        />
                        <IconButton
                          icon={faTrash}
                          onClick={() => handleDelete(order.id)}
                          title="حذف"
                          variant="danger"
                        />
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Typography variant="small" color="blue-gray">
                    {order.customer.name || '-'}
                  </Typography>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <Typography variant="small" color="blue-gray" className="font-medium">
                    {order.orderNumber}
                  </Typography>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <Typography variant="small" color="blue-gray">
                    {order.locationId || '-'}
                  </Typography>
                </td>
                <td className="px-6 py-4">
                  <Typography variant="small" color="blue-gray">
                    {formatCurrency(order.cost)}
                  </Typography>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <Typography variant="small" color="blue-gray">
                    {`${order.distributor?.firstName || ''} ${order.distributor?.lastName || ''}`.trim() || '-'}
                  </Typography>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <Typography variant="small" color="blue-gray">
                    {order.status}
                  </Typography>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <Typography variant="small" color="blue-gray">
                    {order.confirmedAt ? formatDate(order.confirmedAt) : '-'}
                  </Typography>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>
      <CardFooter>
        <div className="flex justify-between">
          <Typography variant="small" color="blue-gray">
            عرض {orders.length} من {ordersStore.orders.length} طلبات
          </Typography>
          <div className="flex items-center gap-2">
            <Button disabled={true} className="flex items-center gap-2">
              السابق
            </Button>
            <Button disabled={true} className="flex items-center gap-2">
              التالي
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default OrderTable;