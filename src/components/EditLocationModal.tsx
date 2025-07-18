import React, { useState, useEffect } from 'react';
import { Location } from '../types/customer';
import Button from './Button';

interface EditLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: Location) => void;
  location: Location | null;
}

export const EditLocationModal: React.FC<EditLocationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  location
}) => {
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    if (location) {
      setLocationName(location.name);
    }
  }, [location]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location && locationName.trim()) {
      onSave({
        ...location,
        name: locationName.trim()
      });
      onClose(); // Close the modal immediately after saving
    }
  };

  if (!isOpen || !location) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            تعديل اسم الموقع
          </h3>
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="اسم الموقع"
              autoFocus
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!locationName.trim() || locationName === location.name}
            >
              حفظ
            </Button>
            <Button
              onClick={onClose}
              variant="outlined"
              size="sm"
              type="button"
            >
              إلغاء
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditLocationModal; 