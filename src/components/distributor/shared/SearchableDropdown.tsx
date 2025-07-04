import React, { useState, ReactNode, useRef, useEffect, ReactElement, useCallback } from "react";

interface OptionProps {
  value: string | number;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export const Option: React.FC<OptionProps> = ({ value, children, onClick, className }) => {
  return (
    <li
      role="option"
      className={`px-4 py-2 cursor-pointer text-gray-700 hover:bg-blue-600 hover:text-white rounded-md transition-all duration-200 ${className}`}
      tabIndex={0}
      data-value={value}
      onClick={onClick}
    >
      {children}
    </li>
  );
};

interface SearchableDropdownProps {
  value?: string | number;
  onChange: (value: string | number) => void;
  onAddOption?: (newValue: string) => void;
  onInputChange?: (inputValue: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  children: ReactNode;
  addedOption?:ReactElement<any, any>;
  autoOpen?: boolean;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  onChange,
  onAddOption,
  onInputChange,
  disabled = false,
  className = "",
  placeholder = "اختر خيارًا",
  children,
  addedOption,
  autoOpen
}) => {
  
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState(value||""); // Keep track of the selected label separately
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, top: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement | null>(null);

  const options = React.Children.toArray(children) as React.ReactElement<OptionProps>[];

  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        left: rect.left,
        top: rect.bottom + 8,
        width: rect.width
      });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition();
      }
    };

    document.addEventListener("click", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isOpen, updateDropdownPosition]);

  useEffect(() => {
    if(value !== undefined)
    setSelectedLabel(value)

  }, [value]);

  // Handle autoOpen functionality
  useEffect(() => {
    if (autoOpen && !disabled && !isOpen) {
      updateDropdownPosition();
      setIsOpen(true);
    }
  }, [autoOpen, disabled, isOpen, updateDropdownPosition]);

      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setQuery(inputValue);
    if (!isOpen) {
      updateDropdownPosition();
    }
    setIsOpen(true); // Keep dropdown open while typing
    setSelectedLabel("");
    
    // Call the external input change handler if provided
    if (onInputChange) {
      onInputChange(inputValue);
    }
  };

  const handleSelect = (option: React.ReactElement<OptionProps>) => {
    if (disabled) return;
    onChange(option.props.value);
    setSelectedLabel(String(option.props.children)); // Update visible title
    setQuery(""); // Clear query input after selection
    setIsOpen(false);
  };

  const filteredOptions = query.trim()
    ? options.filter((option) =>
        String(option.props.children).toLowerCase().includes(query.toLowerCase())
      )
    : options;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
    }else if (e.key === "Enter") {
      if (highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      } else if (onAddOption && query.trim()) {
        onAddOption(query.trim());
        setQuery("");
        setIsOpen(false);
      }
    }
  };


  return (
    <div
      className={`relative w-full ${className} ${disabled ? "pointer-events-none opacity-50" : ""}`}
      dir="rtl"
    >
      <input
        ref={inputRef}
        type="text"
        value={query || selectedLabel}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onClick={() => {
          if (!isOpen) {
            updateDropdownPosition();
          }
          setIsOpen(true);
        }}
        placeholder={placeholder}
        className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        disabled={disabled}
      />

      {isOpen && (
        <div 
          id="dropdownSearch" 
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 w-full dark:bg-gray-700 mt-2"
          style={{
            maxHeight: '240px',
            overflowY: 'scroll',
            overflowX: 'hidden',
            zIndex: 9999,
            left: dropdownPosition.left,
            top: dropdownPosition.top,
            width: dropdownPosition.width
          }}
        >
          <div className="px-3 pb-3 pt-3 text-sm text-gray-700 dark:text-gray-200">
            <ul className="space-y-1">
            {addedOption}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <Option
                  key={option.props.value}
                  value={option.props.value}
                  onClick={() => handleSelect(option)}
                  className={`cursor-pointer text-sm py-2 rounded-md text-right ${
                    String(option.props.children).toLowerCase() === String(selectedLabel).toLowerCase() 
                      ? "bg-blue-500 text-white" 
                      : "bg-white text-gray-900 hover:bg-blue-100"
                  }`}
                >
                  {option.props.children}
                </Option>
              ))
            ) : (
              <li
                className="px-4 py-2 text-gray-500 cursor-pointer rounded-md hover:bg-gray-100 text-right"
              >
                لا يوجد مواقع
              </li>
            )}
            
            {query.trim() && onAddOption && !filteredOptions.some((option) =>
              String(option.props.children).toLowerCase() === query.toLowerCase()
            ) && (
              <li
                className="px-4 py-2 text-blue-600 cursor-pointer rounded-md hover:bg-blue-50 text-right"
                onClick={() => {
                  onAddOption(query.trim());
                  setQuery("");
                  setIsOpen(false);
                }}
              >
                إضافة "{query}"
              </li>
            )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

