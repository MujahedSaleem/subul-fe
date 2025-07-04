import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Layout from '../../components/Layout';
import { faPlus, faPenToSquare, faTrash, faKey } from '@fortawesome/free-solid-svg-icons';
import Button from '../../components/Button';
import IconButton from '../../components/IconButton';
import { Card, CardHeader, CardBody, Typography } from '@material-tailwind/react';
import ChangePasswordModal from '../../components/admin/shared/ChangePasswordModal';
import { RootState, AppDispatch } from '../../store/store';
import { Distributor } from '../../types/distributor';
import { 
  fetchDistributors, 
  deleteDistributor, 
  changeDistributorPassword,
  selectDistributors,
  selectIsLoading,
  selectError
} from '../../store/slices/distributorSlice';
import { showSuccess, showError } from '../../store/slices/notificationSlice';

const Distributors: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const distributors = useSelector(selectDistributors);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState<boolean>(false);
  const [selectedDistributorId, setSelectedDistributorId] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch distributors if they haven't been loaded yet
    if (distributors.length === 0 && !isLoading) {
      dispatch(fetchDistributors());
    }
  }, [dispatch, distributors.length, isLoading]);

  const handleSavePassword = async (oldPassword: string, newPassword: string, confirmPassword: string) => {
    if (!selectedDistributorId) return { status: 400, error: 'No distributor selected' };
    
    try {
      await dispatch(changeDistributorPassword({
        distributorId: selectedDistributorId,
        oldPassword: oldPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      })).unwrap();
      return { status: 200 };
    } catch (error: any) {
      return { status: 500, error: (error as string) || 'Failed to change password' };
    }
  };

  const handleChangePassword = (id: string) => {
    setSelectedDistributorId(id);
    setIsChangePasswordModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموزع؟')) {
      try {
        await dispatch(deleteDistributor(id)).unwrap();
        dispatch(showSuccess({ message: 'تم حذف الموزع بنجاح' }));
      } catch (error: any) {
        console.error("Error deleting distributor:", error);
        dispatch(showError({ 
          message: error.message || 'فشل في حذف الموزع',
          title: 'خطأ في الحذف'
        }));
      }
    }
  };

  const columns = [
    { header: 'الاسم', accessor: (distributor: Distributor) => `${distributor.firstName} ${distributor.lastName}` },
    { header: 'الهاتف', accessor: (distributor: Distributor) => distributor.phone },
    { header: 'الطلبات', accessor: (distributor: Distributor) => distributor.orderCount || 0, className: 'hidden md:table-cell' },
    { 
      header: 'الحالة', 
      accessor: (distributor: Distributor) => (
        <span className={`badge ${distributor.isActive ? 'badge-success' : 'badge-warning'}`}>
          {distributor.isActive ? 'نشط' : 'غير نشط'}
        </span>
      ),
      className: 'hidden md:table-cell' 
    },
    { 
      header: 'الإجراءات', 
      accessor: (distributor: Distributor) => (
        <div className="flex items-center gap-2">
          <IconButton onClick={() => navigate(`/admin/distributors/edit/${distributor.id}`)} icon={faPenToSquare} title="تعديل" />
          <IconButton onClick={() => handleDelete(distributor.id)} icon={faTrash} variant="danger" title="حذف" />
          <IconButton onClick={() => handleChangePassword(distributor.id)} icon={faKey} variant="gradient" title="تغير كلمة السر" />
        </div>
      ),
      className: 'w-32' 
    }
  ];

  if (error) {
    return (
      <Layout title="الموزعون">
        <Card className="h-full w-full" placeholder="" onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}}>
          <CardBody className="text-center py-8" placeholder="" onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}}>
            <Typography variant="h6" color="red" placeholder="" onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}}>
              خطأ في تحميل البيانات: {error}
            </Typography>
          </CardBody>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title="الموزعون">
      <Card className="h-full w-full" placeholder="" onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}}>
        <CardHeader floated={false} shadow={false} className="rounded-none flex justify-between items-center" placeholder="" onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}}>
          <Typography variant="h6" color="blue-gray" placeholder="" onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}}>الموزعون</Typography>
          <Button variant="gradient" onClick={() => navigate('/admin/distributors/add')} className="flex items-center gap-2">
            إضافة موزع
          </Button>
        </CardHeader>
        
        {isLoading ? (
          <CardBody className="text-center py-8" placeholder="" onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}}>
            <Typography variant="h6" color="blue-gray" placeholder="" onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}}>جاري التحميل...</Typography>
          </CardBody>
        ) : (
          <CardBody className="overflow-scroll px-0" placeholder="" onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}}>
            <table className="w-full min-w-max table-auto text-left">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.header} className={`${column.className} p-4 border-b border-blue-gray-100`}>
                      <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70" placeholder="" onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}}>
                        {column.header}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {distributors.map((distributor) => (
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
