import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface Action {
  label: string;
  icon: IconDefinition;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  disabled?: boolean;
}