import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { Action } from '../../../types/common';
import Button from '../../Button';

interface MobileMenuProps {
  isOpen: boolean;
  actions: Action[];
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, actions, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="absolute left-4 right-4 mt-2 rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
        <div className="py-2 divide-y divide-slate-100" role="menu">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              disabled={action.disabled}
              variant="tertiary"
              icon={action.icon}
              size="md"
              block
              className="justify-start px-4"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
};

export default MobileMenu;