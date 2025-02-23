import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { faPlus, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import Button from '../../components/Button';
import IconButton from '../../components/IconButton';
import { customersStore } from '../../store/customersStore';
import { Card, CardHeader, CardBody, Typography } from '@material-tailwind/react';

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchAndSubscribe = async () => {
      if (!customersStore.isLoadingData) {
        await customersStore.fetchCustomers();
      }
      const unsubscribe = customersStore.subscribe(() => setIsLoading(false));
      return unsubscribe;
    };
    fetchAndSubscribe();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      setIsLoading(true);
      await customersStore.deleteCustomer(id);
    }
  };

  const columns = [
    { header: 'الاسم', accessor: (customer) => <Typography>{customer.name}</Typography> },
    { header: 'الهاتف', accessor: (customer) => <Typography>{customer.phone}</Typography> },
    { 
      header: 'المواقع', 
      accessor: (customer) => (
        <div className="space-y-1">
          {customer.locations.map((location, index) => (
            <div key={index} className="flex items-center">
              <Typography className="font-medium">{location.name}</Typography>
              <Typography className="mx-2 text-slate-400">|</Typography>
              <Typography className="text-xs text-slate-500">{location.coordinates}</Typography>
            </div>
          ))}
        </div>
      )
    },
    { 
      header: 'الإجراءات', 
      accessor: (customer) => (
        <div className="flex items-center gap-2">
          <IconButton onClick={() => navigate(`/admin/customers/edit/${customer.id}`)} icon={faPenToSquare} title="تعديل" />
          <IconButton onClick={() => handleDelete(customer.id)} icon={faTrash} variant="danger" title="حذف" />
        </div>
      )
    }
  ];

  return (
    <Layout title="العملاء">
      <Card className="h-full w-full">
        <CardHeader floated={false} shadow={false} className="rounded-none flex justify-between items-center">
          <Typography variant="h6" color="blue-gray">العملاء</Typography>
          <Button variant="gradient" onClick={() => navigate('/admin/customers/add')} className="flex items-center gap-2">
            إضافة عميل
          </Button>
        </CardHeader>
        
        {isLoading ? (
          <CardBody className="text-center py-8">
            <Typography variant="h6" color="blue-gray">جاري التحميل...</Typography>
          </CardBody>
        ) : (
          <CardBody className="overflow-auto px-4">
            <table className="w-full min-w-max table-auto text-right border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  {columns.map((column) => (
                    <th key={column.header} className="p-4 border border-gray-300">
                      <Typography variant="small" color="blue-gray" className="font-medium">
                        {column.header}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customersStore.customers.map((customer, rowIndex) => (
                  <tr key={customer.id} className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    {columns.map((column) => (
                      <td key={column.header} className="p-4 border border-gray-300">{column.accessor(customer)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        )}
      </Card>
    </Layout>
  );
};

export default Customers;
