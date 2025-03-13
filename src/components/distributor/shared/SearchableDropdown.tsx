import React, { useState, ReactNode, useRef, useEffect, ReactElement } from "react";

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
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  children: ReactNode;
  addedOption?:ReactElement<any, any>
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  onChange,
  disabled = false,
  className = "",
  placeholder = "اختر خيارًا",
  children,
  addedOption
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState(value||""); // Keep track of the selected label separately
  const inputRef = useRef<HTMLInputElement | null>(null);

  const options = React.Children.toArray(children) as React.ReactElement<OptionProps>[];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if(value !== undefined)
    setSelectedLabel(value)

  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true); // Keep dropdown open while typing
    setSelectedLabel("")
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
    } else if (e.key === "Enter" && filteredOptions[highlightedIndex]) {
      handleSelect(filteredOptions[highlightedIndex]);
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
        value={query || selectedLabel} // Display query text, not selectedLabel
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onClick={()=>setIsOpen(true)}
        placeholder={placeholder}
        className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        disabled={disabled}
      />

      {isOpen && !disabled && (
        <div id="dropdownSearch" className="z-10 bg-white rounded-lg shadow-sm w-60 dark:bg-gray-700 mt-2 absolute">
          <ul className="h-48 px-3 pb-3 overflow-y-auto text-sm text-gray-700 dark:text-gray-200"          >
            {addedOption}
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
              >
                لا يوجد مواقع
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

