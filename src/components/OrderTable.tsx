import React, { useState } from 'react';
import { faPhone, faLocationDot, faCircleCheck, faTrash, faPenToSquare, faEye, faUser, faCalendar, faMoneyBill, faCheckCircle, faUserTie, faHourglassHalf, faPencil } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { Card, CardBody, Typography as MuiTypography } from '@material-tailwind/react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { OrderList } from '../types/order';
import { Customer, Location } from '../types/customer';
import IconButton from './IconButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CallModal from './admin/shared/CallModal';

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
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState('');

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return {
          icon: faCheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          label: 'تم التأكيد'
        };
      case 'Pending':
        return {
          icon: faHourglassHalf,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          label: 'قيد الانتظار'
        };
      case 'New':
        return {
          icon: faCircleCheck,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          label: 'جديد'
        };
      case 'Draft':
        return {
          icon: faPencil,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          label: 'مسودة'
        };
      default:
        return {
          icon: faCircleCheck,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          label: status
        };
    }
  };

  const handleDirectCall = (phone: string) => {
    const cleaned = phone?.replace(/\D/g, '');
    const withoutLeadingZeros = cleaned?.replace(/^0+/, '');
    window.location.href = `tel:${withoutLeadingZeros}`;
  };

  const handleWhatsAppCall = (customer: Customer) => {
    if (customer?.phone) {
      setSelectedCustomerPhone(customer.phone);
      setIsCallModalOpen(true);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {orders.map((order) => {
        const statusConfig = getStatusConfig(order.status);
        
        return (
          <Card 
            key={order.id}
            className={`w-full ${statusConfig.bgColor} hover:shadow-md transition-all duration-300`}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
            placeholder={undefined}
          >
            <CardBody 
              className="p-4"
              onPointerEnterCapture={() => {}}
              onPointerLeaveCapture={() => {}}
              placeholder={undefined}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                  <IconButton
                    icon={faEye}
                    onClick={() => navigate(`/admin/orders/view/${order.id}`)}
                    color="blue"
                    className="hover:bg-blue-100"
                    size="md"
                    title="View Order"
                  />
                  {order.status !== 'Confirmed' && (
                    <>
                      <IconButton
                        icon={faPenToSquare}
                        onClick={() => navigate(`/admin/orders/edit/${order.id}`)}
                        color="blue"
                        className="hover:bg-blue-100"
                        size="md"
                        title="Edit Order"
                      />
                      <IconButton
                        icon={faTrash}
                        onClick={() => handleDelete(order.id)}
                        color="red"
                        className="hover:bg-red-100"
                        size="md"
                        title="Delete Order"
                      />
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon 
                    icon={statusConfig.icon}
                    className={`w-5 h-5 ${statusConfig.color}`}
                  />
                  <MuiTypography 
                    variant="small"
                    className={`font-medium ${statusConfig.color}`}
                    onPointerEnterCapture={() => {}}
                    onPointerLeaveCapture={() => {}}
                    placeholder={undefined}
                  >
                    {statusConfig.label}
                  </MuiTypography>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                {/* Customer Info */}
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-blue-gray-500" />
                  <MuiTypography 
                    variant="small" 
                    color="blue-gray"
                    className="font-medium"
                    onPointerEnterCapture={() => {}}
                    onPointerLeaveCapture={() => {}}
                    placeholder={undefined}
                  >
                    {order.customer?.name}
                  </MuiTypography>
                </div>

                {/* Distributor Info */}
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUserTie} className="w-4 h-4 text-blue-gray-500" />
                  <MuiTypography 
                    variant="small" 
                    color="blue-gray"
                    className="font-medium"
                    onPointerEnterCapture={() => {}}
                    onPointerLeaveCapture={() => {}}
                    placeholder={undefined}
                  >
                    {order.distributor?.name}
                  </MuiTypography>
                </div>

                {/* Order Number */}
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-blue-gray-500" />
                  <MuiTypography 
                    variant="small" 
                    color="blue-gray"
                    className="font-medium"
                    onPointerEnterCapture={() => {}}
                    onPointerLeaveCapture={() => {}}
                    placeholder={undefined}
                  >
                    {order.orderNumber}
                  </MuiTypography>
                </div>

                {/* Cost */}
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faMoneyBill} className="w-4 h-4 text-blue-gray-500" />
                  <MuiTypography 
                    variant="small" 
                    color="blue-gray"
                    className="font-medium"
                    onPointerEnterCapture={() => {}}
                    onPointerLeaveCapture={() => {}}
                    placeholder={undefined}
                  >
                    {formatCurrency(order.cost)}
                  </MuiTypography>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  {order.customer?.phone && (
                    <IconButton
                      icon={faPhone}
                      onClick={() => handleCallCustomer(order.customer)}
                      color="blue"
                      className="hover:bg-blue-100"
                      size="md"
                      title="Call Customer"
                    />
                  )}
                  {order.location && (
                    <IconButton
                      icon={faLocationDot}
                      onClick={() => handleOpenLocation(order.location)}
                      color="blue"
                      className="hover:bg-blue-100"
                      size="md"
                      title="View Location"
                    />
                  )}
                </div>
              </div>

              {order.status === 'New' && (
                <div className="mt-4">
                  <Button
                    variant="gradient"
                    color="green"
                    onClick={() => handleConfirmOrder(order)}
                    className="flex items-center gap-2 w-full justify-center"
                  >
                    <FontAwesomeIcon icon={faCircleCheck} className="w-5 h-5" />
                    تأكيد الطلب
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        );
      })}

      {isCallModalOpen && selectedCustomerPhone && (
        <CallModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          phone={selectedCustomerPhone}
        />
      )}
    </div>
  );
};

export default OrderTable;