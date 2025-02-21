import React from 'react';
import Button from '../../Button';
import { Input, Option, Select } from '@material-tailwind/react';

interface FilterField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'datetime-local';
  value: string;
  onChange: (value: string) => void;
  options?: { value: string; label: string }[];
}

interface FilterPanelProps {
  fields: FilterField[];
  onClear: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ fields, onClear }) => {
  return (
    <div className="bg-white/90 backdrop-blur-xl backdrop-saturate-150 rounded-2xl shadow-xl border border-slate-200/60 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {fields.map((field) => (
          <div key={field.id}>
            <label 
              htmlFor={field.id} 
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              {field.label}
            </label>
            {field.type === 'select' ? (
              <Select
                id={field.id}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="block w-full rounded-xl border-slate-200 bg-white/50 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-shadow duration-150"
              >
                {field.options?.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            ) : (
              <Input
                type={field.type}
                id={field.id}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="block w-full rounded-xl border-slate-200 bg-white/50 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-shadow duration-150"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={onClear}
          variant="secondary"
          size="sm"
        >
          مسح الفلتر
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel;