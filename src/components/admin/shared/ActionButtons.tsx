import React from 'react';
import IconButton from '../../IconButton';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface Action {
  icon: IconDefinition;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  title?: string;
  show?: boolean;
}

interface ActionButtonsProps {
  actions: Action[];
  direction?: 'row' | 'column';
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ actions, direction = 'row' }) => {
  const visibleActions = actions.filter(action => action.show !== false);

  if (visibleActions.length === 0) return null;

  return (
    <div className={`flex gap-1 ${direction === 'column' ? 'flex-col' : 'items-center'}`}>
      {visibleActions.map((action, index) => (
        <IconButton
          key={index}
          onClick={action.onClick}
          icon={action.icon}
          variant={action.variant || 'primary'}
          size="sm"
          title={action.title}
        />
      ))}
    </div>
  );
};

export default ActionButtons;