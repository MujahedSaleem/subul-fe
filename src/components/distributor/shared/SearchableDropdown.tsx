import React, { useState, useEffect, ReactNode } from "react";

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
  onAddOption?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  children: ReactNode;
  defaultOption?: string;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  onChange,
  onAddOption,
  disabled = false,
  className = "",
  placeholder = "اختر خيارًا",
  children,
  defaultOption = "أضف الخيار الجديد",
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState("");

  const options = React.Children.toArray(children) as React.ReactElement<OptionProps>[];

  useEffect(() => {
    const selectedOption = options.find((opt) => opt.props.value === value);
    setSelectedLabel(selectedOption ? String(selectedOption.props.children) : "");
  }, [value, options]);

  const filteredOptions = query.trim()
    ? options.filter((option) =>
        String(option.props.children).toLowerCase().includes(query.toLowerCase())
      )
    : options;

  const handleSelect = (option: React.ReactElement<OptionProps>) => {
    if (disabled) return; // Prevent selection when disabled
    onChange(option.props.value);
    setSelectedLabel(String(option.props.children));
    setQuery("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return; // Prevent key interactions when disabled

    if (e.key === "ArrowDown") {
      setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
    } else if (e.key === "Enter" && filteredOptions[highlightedIndex]) {
      handleSelect(filteredOptions[highlightedIndex]);
    }
  };

  const handleDefaultOptionClick = () => {
    if (disabled) return;
    if (query.trim() !== "" && onAddOption) {
      onAddOption(query.trim()); // Notify parent to add option
    }
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div
      className={`relative w-full ${className} ${disabled ? "pointer-events-none opacity-50" : ""}`}
      dir="rtl"
    >
      <input
        type="text"
        value={query || selectedLabel}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => !disabled && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full border-2 rounded-md py-3 px-4 text-right bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ${
          disabled
            ? "bg-gray-100 cursor-not-allowed border-gray-300"
            : "bg-white hover:border-blue-500 focus:ring-blue-500"
        }`}
      />
      {isOpen && !disabled && (
        <ul
          className="absolute w-full bg-white border-2 border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg z-10 text-right"
          role="listbox"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <Option
                key={option.props.value}
                value={option.props.value}
                onClick={() => handleSelect(option)}
                className={`cursor-pointer text-sm py-2 rounded-md ${
                  highlightedIndex === index ? "bg-blue-600 text-white" : "hover:bg-blue-100"
                }`}
              >
                {option.props.children}
              </Option>
            ))
          ) : (
            <li
              className="px-4 py-2 text-gray-500 cursor-pointer rounded-md hover:bg-gray-100"
              onClick={handleDefaultOptionClick}
            >
              {defaultOption} "{query}"
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
