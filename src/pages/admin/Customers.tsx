import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { faPlus, faPenToSquare, faTrash, faSearch, faSpinner, faLocationDot, faPhone } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../../components/Button';
import IconButton from '../../components/IconButton';
import { customersStore } from '../../store/customersStore';
import { Card, CardHeader, CardBody, Typography, Input } from '@material-tailwind/react';
import { Customer } from '../../types/customer';

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        await customersStore.fetchCustomers();
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();

    const unsubscribe = customersStore.subscribe(() => {
      setCustomers(customersStore.customers);
    });

    setCustomers(customersStore.customers);

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      setIsLoading(true);
      try {
        await customersStore.deleteCustomer(id);
      } catch (error) {
        console.error("Error deleting customer:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  return (
    <Layout title="العملاء">
      <Card 
        className="h-full w-full shadow-lg"
        placeholder=""
        onPointerEnterCapture={() => {}}
        onPointerLeaveCapture={() => {}}
      >
        <CardHeader 
          floated={false} 
          shadow={false} 
          className="rounded-none bg-white p-6"
          placeholder=""
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col gap-1">
              <Typography 
                variant="h4" 
                color="blue-gray"
                className="font-bold"
                placeholder=""
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              >
                العملاء
              </Typography>
              <Typography
                variant="small"
                color="blue-gray"
                className="font-normal"
                placeholder=""
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              >
                إدارة العملاء وإضافة عملاء جدد
              </Typography>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-72">
                <Input
                  label="بحث عن عميل"
                  icon={<FontAwesomeIcon icon={faSearch} className="text-slate-400" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  crossOrigin={undefined}
                  placeholder=""
                  onPointerEnterCapture={() => {}}
                  onPointerLeaveCapture={() => {}}
                />
              </div>
              <Button 
                variant="gradient" 
                onClick={() => navigate('/admin/customers/add')} 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <FontAwesomeIcon icon={faPlus} />
                إضافة عميل
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isLoading ? (
          <CardBody 
            className="text-center py-12"
            placeholder=""
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          >
            <div className="flex flex-col items-center gap-4">
              <FontAwesomeIcon 
                icon={faSpinner} 
                className="h-8 w-8 text-blue-500 animate-spin" 
              />
              <Typography 
                variant="h6" 
                color="blue-gray"
                className="font-medium"
                placeholder=""
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              >
                جاري تحميل البيانات...
              </Typography>
            </div>
          </CardBody>
        ) : (
          <CardBody 
            className="overflow-auto px-6"
            placeholder=""
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          >
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Typography 
                  variant="h6" 
                  color="blue-gray"
                  className="font-medium"
                  placeholder=""
                  onPointerEnterCapture={() => {}}
                  onPointerLeaveCapture={() => {}}
                >
                  لا يوجد عملاء
                </Typography>
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="mt-2"
                  placeholder=""
                  onPointerEnterCapture={() => {}}
                  onPointerLeaveCapture={() => {}}
                >
                  {searchQuery ? 'لم يتم العثور على نتائج للبحث' : 'قم بإضافة عميل جديد'}
                </Typography>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomers.map((customer) => (
                  <Card
                    key={customer.id}
                    className="hover:shadow-lg transition-shadow duration-300"
                    placeholder=""
                    onPointerEnterCapture={() => {}}
                    onPointerLeaveCapture={() => {}}
                  >
                    <CardHeader
                      floated={false}
                      shadow={false}
                      className="rounded-t-lg bg-gradient-to-r from-blue-600 to-blue-800 p-4"
                      placeholder=""
                      onPointerEnterCapture={() => {}}
                      onPointerLeaveCapture={() => {}}
                    >
                      <Typography
                        variant="h5"
                        color="white"
                        className="font-bold"
                        placeholder=""
                        onPointerEnterCapture={() => {}}
                        onPointerLeaveCapture={() => {}}
                      >
                        {customer.name}
                      </Typography>
                    </CardHeader>
                    <CardBody
                      className="p-4"
                      placeholder=""
                      onPointerEnterCapture={() => {}}
                      onPointerLeaveCapture={() => {}}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faPhone} className="text-slate-400" />
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-medium"
                            placeholder=""
                            onPointerEnterCapture={() => {}}
                            onPointerLeaveCapture={() => {}}
                          >
                            {customer.phone}
                          </Typography>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faLocationDot} className="text-slate-400" />
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-medium"
                              placeholder=""
                              onPointerEnterCapture={() => {}}
                              onPointerLeaveCapture={() => {}}
                            >
                              المواقع
                            </Typography>
                          </div>
                          <div className="space-y-2">
                            {customer.locations.map((location, index) => (
                              <div
                                key={index}
                                className="bg-slate-50 rounded-lg p-3"
                              >
                                <Typography
                                  variant="small"
                                  color="blue-gray"
                                  className="font-medium"
                                  placeholder=""
                                  onPointerEnterCapture={() => {}}
                                  onPointerLeaveCapture={() => {}}
                                >
                                  {location.name}
                                </Typography>
                                <Typography
                                  variant="small"
                                  color="blue-gray"
                                  className="text-xs mt-1"
                                  placeholder=""
                                  onPointerEnterCapture={() => {}}
                                  onPointerLeaveCapture={() => {}}
                                >
                                  {location.coordinates}
                                </Typography>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                          <IconButton 
                            onClick={() => navigate(`/admin/customers/edit/${customer.id}`)} 
                            icon={faPenToSquare} 
                            title="تعديل"
                            className="hover:bg-blue-50 text-blue-600"
                          />
                          <IconButton 
                            onClick={() => handleDelete(Number(customer.id))} 
                            icon={faTrash} 
                            variant="danger" 
                            title="حذف"
                            className="hover:bg-red-50"
                          />
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </CardBody>
        )}
      </Card>
    </Layout>
  );
};

export default Customers;
