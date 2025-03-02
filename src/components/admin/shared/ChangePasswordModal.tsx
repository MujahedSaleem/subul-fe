import React, { useState, useEffect } from 'react';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import IconButton from '../../IconButton';
import Button from '../../Button';
import { Input } from '@material-tailwind/react';

interface ChangePasswordModalProps {
  onClose: () => void;
  onSave: (oldPassword: string, newPassword: string, confirmedPassword: string) => Promise<{ status: number; error?: string }>;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose, onSave }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validatePassword = (password: string): boolean => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const handleSave = async () => {
    setError(null);

    // Validate old password
    if (!oldPassword.trim()) {
      setError('الرجاء إدخال كلمة المرور القديمة.');
      return;
    }

    // Validate new password
    if (!newPassword.trim()) {
      setError('الرجاء إدخال كلمة المرور الجديدة.');
      return;
    }

    if (newPassword.length < 8) {
      setError('كلمة المرور الجديدة يجب أن تحتوي على ما لا يقل عن 8 أحرف.');
      return;
    }

    if (!validatePassword(newPassword)) {
      setError(
        'كلمة المرور الجديدة يجب أن تحتوي على حرف كبير، حرف صغير، رقم، ورمز خاص على الأقل.'
      );
      return;
    }

    // Validate confirm password
    if (newPassword !== confirmPassword) {
      setError('كلمات المرور لا تتطابق.');
      return;
    }

    setLoading(true);

    try {
      const response = await onSave(oldPassword, newPassword, confirmPassword);
      if (response.status === 200) {
        onClose();
      } else {
        setError(response.error || 'حدث خطأ.');
      }
    } catch (err) {
      setError('فشل في تحديث كلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  // Real-time validation for confirm password
  useEffect(() => {
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      setError('كلمات المرور لا تتطابق.');
    } else if (error === 'كلمات المرور لا تتطابق.') {
      setError(null); // Clear the error if passwords match
    }
  }, [confirmPassword, newPassword, error]);

  // Function to check if the form is valid
  const isFormValid = (): boolean => {
    if (!oldPassword.trim()) return false;
    if (!newPassword.trim()) return false;
    if (newPassword.length < 8) return false;
    if (!validatePassword(newPassword)) return false;
    if (newPassword !== confirmPassword) return false;
    return true;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">تغيير كلمة المرور</h2>
          <IconButton icon={faTimes} variant="danger" onClick={onClose} />
        </div>
        <div className="space-y-4">
          {/* Old Password Input */}
          <Input
            type="password"
            label="كلمة المرور القديمة"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            error={error && !oldPassword.trim() ? 'الرجاء إدخال كلمة المرور القديمة.' : undefined}
            required
          />

          {/* New Password Input */}
          <Input
            type="password"
            label="كلمة المرور الجديدة"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={
              error &&
              ((newPassword.length < 8 && 'كلمة المرور الجديدة يجب أن تحتوي على ما لا يقل عن 8 أحرف.') ||
                (!validatePassword(newPassword) &&
                  'كلمة المرور الجديدة يجب أن تحتوي على حرف كبير، حرف صغير، رقم، ورمز خاص على الأقل.'))
            }
            required
          />

          {/* Confirm Password Input */}
          <Input
            type="password"
            label="تأكيد كلمة المرور الجديدة"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={error === 'كلمات المرور لا تتطابق.' ? 'كلمات المرور لا تتطابق.' : undefined}
            required
          />

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={loading}
            disabled={!isFormValid() || loading}
          >
            حفظ
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;