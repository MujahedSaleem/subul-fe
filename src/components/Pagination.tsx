import React from 'react';
import { IconButton, Select, Option } from '@material-tailwind/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}) => {
  const pageSizeOptions = [10, 20, 50, 100];

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-4 px-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">
          عرض {Math.min((currentPage - 1) * pageSize + 1, totalItems)} إلى{' '}
          {Math.min(currentPage * pageSize, totalItems)} من {totalItems} عنصر
        </span>
        <div className="relative">
          <Select
            value={pageSize.toString()}
            onChange={(value) => value && onPageSizeChange(Number(value))}
            className="w-24 border border-blue-gray-200 rounded-lg bg-white"
            selected={() => (
              <span className="text-right block truncate">
                {pageSize}
              </span>
            )}
            placeholder=""
            menuProps={{ 
              className: "text-right bg-white shadow-lg rounded-lg border border-blue-gray-200",
              lockScroll: false
            }}
            containerProps={{ 
              className: "min-w-[96px] text-right"
            }}
            animate={{
              mount: { y: 0, scale: 1 },
              unmount: { y: -25, scale: 0.95 },
            }}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          >
            {pageSizeOptions.map((size) => (
              <Option 
                key={size} 
                value={size.toString()} 
                className="leading-tight text-right hover:bg-blue-50"
              >
                {size}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <IconButton
          size="sm"
          variant="outlined"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="hover:bg-blue-50"
          placeholder={undefined}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        >
          <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
        </IconButton>

        <span className="text-sm text-gray-700 font-medium">
          صفحة {currentPage} من {totalPages}
        </span>

        <IconButton
          size="sm"
          variant="outlined"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="hover:bg-blue-50"
          placeholder={undefined}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  );
};

export default Pagination; 