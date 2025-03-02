import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { faPlus, faPenToSquare, faTrash, faKey } from '@fortawesome/free-solid-svg-icons';
import Button from '../../components/Button';
import IconButton from '../../components/IconButton';
import { distributorsStore } from '../../store/distributorsStore';
import { Card, CardHeader, CardBody, Typography } from '@material-tailwind/react';
import ChangePasswordModal from '../../components/admin/shared/ChangePasswordModal';

const Distributors: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState<boolean>(false);
  const [selectedDistributorId, setSelectedDistributorId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true); // Start loading
  
    const unsubscribe = distributorsStore.subscribe(() => setIsLoading(false)); // Subscribe first
  
    const fetchAndSubscribe = async () => {
      try {
        if (!distributorsStore.isLoadingData) {
          await distributorsStore.fetchDistributors();
        }
      } catch (error) {
        console.error("Error fetching distributors:", error);
        setIsLoading(false); // Ensure loading stops even if there's an error
      }
    };
  
    fetchAndSubscribe();
  
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);
  const handleSavePassword = async (oldPassword: string, newPassword: string, confirmPassword: string) => {
    if (!selectedDistributorId) return { status: 400, error: 'No distributor selected' };
    try {
      await distributorsStore.changeDistributorPassword(selectedDistributorId, oldPassword, newPassword, confirmPassword);
      return { status: 200 };
    } catch (error) {
      return { status: 500, error: error.message};
    }
  };
  const handleChangePassword = (id: string) => {
    setSelectedDistributorId(id);
    setIsChangePasswordModalOpen(true);
  };
  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموزع؟')) {
      setIsLoading(true);
      await distributorsStore.deleteDistributor(id);
    }
  };

  const columns = [
    { header: 'الاسم', accessor: (distributor) => `${distributor.firstName} ${distributor.lastName}` },
    { header: 'الهاتف', accessor: (distributor) => distributor.phone },
    { header: 'الطلبات', accessor: (distributor) => distributor.orderCount, className: 'hidden md:table-cell' },
    { 
      header: 'الحالة', 
      accessor: (distributor) => (
        <span className={`badge ${distributor.isActive ? 'badge-success' : 'badge-warning'}`}>
          {distributor.isActive ? 'نشط' : 'غير نشط'}
        </span>
      ),
      className: 'hidden md:table-cell' 
    },
    { 
      header: 'الإجراءات', 
      accessor: (distributor) => (
        <div className="flex items-center gap-2">
          <IconButton onClick={() => navigate(`/admin/distributors/edit/${distributor.id}`)} icon={faPenToSquare} title="تعديل" />
          <IconButton onClick={() => handleDelete(distributor.id)} icon={faTrash} variant="danger" title="حذف" />
          <IconButton onClick={() => handleChangePassword(distributor.id)} icon={faKey} variant="gradient" title="تغير كلمة السر" />
        </div>
      ),
      className: 'w-32' 
    }
  ];

  return (
    <Layout title="الموزعون">
      <Card className="h-full w-full">
        <CardHeader floated={false} shadow={false} className="rounded-none flex justify-between items-center">
          <Typography variant="h6" color="blue-gray">الموزعون</Typography>
          <Button variant="gradient" onClick={() => navigate('/admin/distributors/add')} className="flex items-center gap-2">
            إضافة موزع
          </Button>
        </CardHeader>
        
        {isLoading ? (
          <CardBody className="text-center py-8">
            <Typography variant="h6" color="blue-gray">جاري التحميل...</Typography>
          </CardBody>
        ) : (
          <CardBody className="overflow-scroll px-0">
            <table className="w-full min-w-max table-auto text-left">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.header} className={`${column.className} p-4 border-b border-blue-gray-100`}>
                      <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                        {column.header}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {distributorsStore.distributors.map((distributor) => (
                  <tr key={distributor.id}>
                    {columns.map((column) => (
                      <td key={column.header} className={`${column.className} p-4`}>{column.accessor(distributor)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        )}
      </Card>
      {isChangePasswordModalOpen && (
        <ChangePasswordModal 
          onClose={() => setIsChangePasswordModalOpen(false)} 
          onSave={handleSavePassword} 
        />
      )}
    </Layout>
  );
};

export default Distributors;
