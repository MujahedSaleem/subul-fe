import React, { InputHTMLAttributes, ChangeEvent } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="relative w-full min-w-[200px]">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`block w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg shadow-sm 
          placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 
          focus:border-primary-500 ${error ? 'border-red-500' : ''} ${className}`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FormInput; 