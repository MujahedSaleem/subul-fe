import React from 'react';
import { faSave, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import type { Distributor } from '../types/distributor';
import Button from './Button';
import { Input, Option, Select } from '@material-tailwind/react';

interface DistributorFormProps {
  distributor: Partial<Distributor>;
  setDistributor: React.Dispatch<React.SetStateAction<Partial<Distributor>>>;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  title: string;
}

const DistributorForm: React.FC<DistributorFormProps> = ({
  distributor,
  setDistributor,
  onSubmit,
  onBack,
  title,
}) => {
  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={onSubmit} className="form-section">
        <div className="form-body">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">{title}</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">
                الاسم الأول
              </label>
              <Input
                type="text"
                id="firstName"
                value={distributor.firstName || ''}
                onChange={(e) =>
                  setDistributor((prev) => ({ ...prev, firstName: e.target.value }))
                }
                className="block w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">
                الاسم الأخير
              </label>
              <Input
                type="text"
                id="lastName"
                value={distributor.lastName || ''}
                onChange={(e) =>
                  setDistributor((prev) => ({ ...prev, lastName: e.target.value }))
                }
                className="block w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-slate-700 mb-1">
                اسم المستخدم
              </label>
              <Input
                type="text"
                id="userName"
                value={distributor.userName || ''}
                onChange={(e) =>
                  setDistributor((prev) => ({ ...prev, userName: e.target.value }))
                }
                className="block w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                الهاتف
              </label>
              <Input
                type="tel"
                id="phone"
                value={distributor.phone || ''}
                onChange={(e) =>
                  setDistributor((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="block w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
                الحالة
              </label>
              <Select
                id="status"
                value={distributor.isActive ?? true ? 'Active' : 'Inactive'}
                onChange={(e) =>
                  setDistributor((prev) => ({
                    ...prev,
                    isActive: e.target.value === 'Active',
                  }))
                }
                className="block w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <Option value="Active">نشط</Option>
                <Option value="Inactive">غير نشط</Option>
              </Select>
            </div>
          </div>
        </div>
        <div className="form-footer flex justify-between items-center mt-6">
          <Button
            type="button"
            onClick={onBack}
            variant="secondary"
            icon={faArrowRight}
          >
            رجوع
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={faSave}
          >
            حفظ
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DistributorForm;