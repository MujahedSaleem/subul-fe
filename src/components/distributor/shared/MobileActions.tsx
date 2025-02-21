import React from 'react';
import Button from '../../Button';
import type { Action } from '../../../types/common';

interface MobileActionsProps {
  actions: Action[];
}

const MobileActions: React.FC<MobileActionsProps> = ({ actions }) => {
  return (
    <div className="md:hidden mb-6 grid grid-cols-2 gap-3">
      {actions.map((action, index) => (
        <Button
          key={index}
          onClick={action.onClick}
          variant={action.variant || 'primary'}
          icon={action.icon}
          disabled={action.disabled}
          size="md"
          block
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
};

export default MobileActions;