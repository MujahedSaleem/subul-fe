import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import Button from '../../Button';
import IconButton from '../../IconButton';
import type { Action } from '../../../types/common';

interface DistributorHeaderProps {
  title: string;
  actions: Action[];
  mobileActions?: Action[];
  onMenuToggle?: () => void;
}

const DistributorHeader: React.FC<DistributorHeaderProps> = ({
  title,
  actions,
  mobileActions,
  onMenuToggle
}) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl lg:text-2xl font-semibold text-slate-800">
            {title}
          </h1>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {actions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                variant={action.variant || 'primary'}
                icon={action.icon}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          {mobileActions && mobileActions.length > 0 && (
            <div className="md:hidden">
              <IconButton
                onClick={onMenuToggle}
                icon={faEllipsisVertical}
                variant="tertiary"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DistributorHeader;