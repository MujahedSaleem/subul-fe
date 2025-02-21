import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'danger' | 'warning' | 'info' | 'dark' | 'light'|'outlined'|'gradient'|'text';
  size?: 'sm' | 'md' | 'lg';
  outline?: boolean;
  pill?: boolean;
  block?: boolean;
  icon?: IconDefinition;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  outline = false,
  pill = false,
  block = false,
  icon,
  iconPosition = 'left',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200';
  
  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-sm'
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

  const shapeStyles = pill ? 'rounded-full' : 'rounded-lg';
  const blockStyles = block ? 'w-full' : '';
  const disabledStyles = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : 'shadow-sm hover:shadow focus:ring-2 focus:ring-offset-1 active:scale-[0.98] transform transition-transform duration-100';
  const loadingStyles = loading ? 'cursor-wait' : '';

  const iconSpacing = icon ? (iconPosition === 'left' ? 'ml-1.5' : 'mr-1.5') : '';

  return (
    <button
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${shapeStyles}
        ${blockStyles}
        ${disabledStyles}
        ${loadingStyles}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center">
          <svg className="animate-spin h-4 w-4 mr-1.5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>جاري التحميل...</span>
        </div>
      ) : (
        <div className="flex items-center">
          {icon && iconPosition === 'left' && (
            <FontAwesomeIcon icon={icon} className={`h-3.5 w-3.5 ${iconSpacing}`} />
          )}
          <span>{children}</span>
          {icon && iconPosition === 'right' && (
            <FontAwesomeIcon icon={icon} className={`h-3.5 w-3.5 ${iconSpacing}`} />
          )}
        </div>
      )}
    </button>
  );
};

export default Button;