import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ 
  label, 
  error, 
  className = '', 
  children, 
  ...props 
}) => {
  return (
    <div className="relative">
      {label && (
        <label 
          htmlFor={props.id} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <select
        {...props}
        className={`${className} ${error ? 'border-red-500' : ''}`}
      >
        <option value="" disabled>
          {label || 'Select an option'}
        </option>
        {children}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}; 