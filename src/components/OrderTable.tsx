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
import { handleDirectCall } from '../utils/distributorUtils';

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
            className={`w-full ${statusConfig.bgColor} hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden border border-gray-100`}
            placeholder={undefined}
          >
            <CardBody 
              className="p-6"
              placeholder={undefined}
            >
              <div className="flex justify-between items-start mb-4">
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
                
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm">
                  <FontAwesomeIcon 
                    icon={statusConfig.icon}
                    className={`w-4 h-4 ${statusConfig.color}`}
                  />
                  <MuiTypography 
                    variant="small"
                    className={`font-medium ${statusConfig.color}`}
                    placeholder={undefined}
                  >
                    {statusConfig.label}
                  </MuiTypography>
                </div>
              </div>

              <div className="space-y-4 mt-4">
                {/* Order Number and Date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-blue-gray-500" />
                    <MuiTypography 
                      variant="small" 
                      color="blue-gray"
                      className="font-medium"
                      placeholder={undefined}
                    >
                      {order.orderNumber}
                    </MuiTypography>
                  </div>
                  <MuiTypography 
                    variant="small" 
                    color="blue-gray"
                    className="text-gray-500 font-bold"
                    placeholder={undefined}
                  >
                    {new Date(order.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </MuiTypography>
                </div>

                {/* Customer Info */}
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-blue-600" />
                  <MuiTypography 
                    variant="small" 
                    color="blue-gray"
                    className="font-medium"
                    placeholder={undefined}
                  >
                    {order.customer?.name}
                  </MuiTypography>
                </div>

                {/* Distributor Info */}
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <FontAwesomeIcon icon={faUserTie} className="w-4 h-4 text-blue-600" />
                  <MuiTypography 
                    variant="small" 
                    color="blue-gray"
                    className="font-medium"
                    placeholder={undefined}
                  >
                    {order.distributor?.name}
                  </MuiTypography>
                </div>

                {/* Location Info */}
                <div 
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleOpenLocation(order.location)}
                >
                  <FontAwesomeIcon icon={faLocationDot} className="w-4 h-4 text-blue-600" />
                  <MuiTypography 
                    variant="small" 
                    color="blue-gray"
                    className="font-medium"
                    placeholder={undefined}
                  >
                    {order.location?.name || 'الموقع'}
                  </MuiTypography>
                </div>

                {/* Cost */}
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faMoneyBill} className="w-4 h-4 text-green-600" />
                    <MuiTypography 
                      variant="small" 
                      color="blue-gray"
                      className="font-medium"
                      placeholder={undefined}
                    >
                      التكلفة
                    </MuiTypography>
                  </div>
                  <MuiTypography 
                    variant="small" 
                    color="green"
                    className="font-bold"
                    placeholder={undefined}
                  >
                    {formatCurrency(order.cost)}
                  </MuiTypography>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="text"
                      color="blue"
                      className="flex items-center gap-2"
                      onClick={() => handleDirectCall(order.customer?.phone || '')}
                    >
                      <FontAwesomeIcon icon={faPhone} className="w-4 h-4" />
                      <span>اتصال</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="text"
                      color="green"
                      className="flex items-center gap-2"
                      onClick={() => handleWhatsAppCall(order.customer)}
                    >
                      <FontAwesomeIcon icon={faWhatsapp} className="w-4 h-4" />
                      <span>واتساب</span>
                    </Button>
                  </div>
                </div>
              </div>
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