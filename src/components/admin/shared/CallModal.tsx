import React from 'react';
import { faXmark, faPhone } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import Button from '../../Button';
import IconButton from '../../IconButton';
import { handleDirectCall } from '../../../utils/distributorUtils';

interface CallModalProps {
  phone: string;
  isOpen: boolean;
  onClose: () => void;
  showDialOption?: boolean; // New prop to control whether to show dial option
}

const CallModal: React.FC<CallModalProps> = ({ phone, isOpen, onClose, showDialOption = false }) => {
  if (!isOpen) return null;

  const formatPhoneNumber = (phone: string, countryCode: string) => {
    const cleaned = phone?.replace(/\D/g, '');
    const withoutLeadingZeros = cleaned?.replace(/^0+/, '');
    return `${countryCode}${withoutLeadingZeros}`;
  };

  const phone970 = formatPhoneNumber(phone, '+970');
  const phone972 = formatPhoneNumber(phone, '+972');

  const handleWhatsAppCall = (formattedPhone: string) => {
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
    onClose();
  };



  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-content">
          <div className="modal-header">
            <div className="absolute left-4 top-4">
              <IconButton
                onClick={onClose}
                icon={faXmark}
                variant="tertiary"
                size="sm"
              />
            </div>
            
            <h3 className="text-lg font-semibold text-slate-900">
              {showDialOption ? 'اختر طريقة الاتصال' : 'اختر رقم الواتساب'}
            </h3>
          </div>
          
          <div className="modal-body">
            <div className="space-y-4">
              {[phone970, phone972].map((formattedPhone) => (
                <div key={formattedPhone} className="space-y-2">
                  <div className="text-sm font-medium text-slate-700">
                    {formattedPhone}
                  </div>
                  <div className={`flex gap-2 ${showDialOption ? 'flex-row' : 'flex-col'}`}>
                    {showDialOption && (
                      <Button
                        onClick={() => {handleDirectCall(formattedPhone);onClose()}}
                        variant="primary"
                        icon={faPhone}
                        size="md"
                        block={!showDialOption}
                      >
                        اتصال مباشر
                      </Button>
                    )}
                    <Button
                      onClick={() => handleWhatsAppCall(formattedPhone.replace('+', ''))}
                      variant="success"
                      icon={faWhatsapp}
                      size="md"
                      block={!showDialOption}
                    >
                      واتساب
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallModal;