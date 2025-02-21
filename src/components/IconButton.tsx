import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconDefinition;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'danger' | 'warning' | 'info' | 'dark' | 'light'| 'gradient'|'text';
  size?: 'sm' | 'md' | 'lg';
  outline?: boolean;
  rounded?: boolean;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'primary',
  size = 'md',
  outline = false,
  rounded = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center transition-all duration-200';
  
  const sizeStyles = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2'
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const variantStyles = {
    primary: outline
      ? 'border border-primary-500 text-primary-500 hover:bg-primary-50 focus:ring-primary-500/20'
      : 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500/20',
    secondary: outline
      ? 'border border-slate-300 text-slate-600 hover:bg-slate-50 focus:ring-slate-500/20'
      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 focus:ring-slate-500/20',
    tertiary: outline
      ? 'border border-slate-200 text-slate-500 hover:bg-slate-50 focus:ring-slate-400/20'
      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 focus:ring-slate-400/20',
    success: outline
      ? 'border border-emerald-500 text-emerald-500 hover:bg-emerald-50 focus:ring-emerald-500/20'
      : 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500/20',
    danger: outline
      ? 'border border-red-500 text-red-500 hover:bg-red-50 focus:ring-red-500/20'
      : 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500/20',
    warning: outline
      ? 'border border-amber-500 text-amber-500 hover:bg-amber-50 focus:ring-amber-500/20'
      : 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500/20',
    info: outline
      ? 'border border-sky-500 text-sky-500 hover:bg-sky-50 focus:ring-sky-500/20'
      : 'bg-sky-500 text-white hover:bg-sky-600 focus:ring-sky-500/20',
    dark: outline
      ? 'border border-slate-800 text-slate-800 hover:bg-slate-50 focus:ring-slate-800/20'
      : 'bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-800/20',
    light: outline
      ? 'border border-slate-200 text-slate-600 hover:bg-slate-50 focus:ring-slate-400/20'
      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 focus:ring-slate-400/20',
    gradient: outline
      ? 'border border-transparent text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 focus:ring-pink-500/20'
      : 'text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 focus:ring-pink-500/20',
      text: 'bg-transparent text-slate-600 hover:bg-slate-50 focus:ring-slate-400/20' // Text variant styles

  };

  const shapeStyles = rounded ? 'rounded-full' : 'rounded-lg';

  return (
    <button
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${shapeStyles}
        shadow-sm hover:shadow
        focus:ring-2 focus:ring-offset-1 active:scale-[0.98]
        transform transition-transform duration-100
        ${className}
      `}
      {...props}
    >
      <FontAwesomeIcon icon={icon} className={iconSizes[size]} />
    </button>
  );
};

export default IconButton;