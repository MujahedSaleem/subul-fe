import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Typography } from '@material-tailwind/react';

interface LoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ 
  message = "جاري تحميل البيانات...", 
  size = 'md',
  className = ""
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <FontAwesomeIcon 
        icon={faSpinner} 
        className={`${sizeClasses[size]} text-blue-500 animate-spin`} 
      />
      <Typography 
        variant="h6" 
        color="blue-gray"
        className={`font-medium ${textSizes[size]}`}
        placeholder=""
        onPointerEnterCapture={() => {}}
        onPointerLeaveCapture={() => {}}
      >
        {message}
      </Typography>
    </div>
  );
};

export default Loader; 