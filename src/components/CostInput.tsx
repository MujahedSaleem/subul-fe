import { Input } from '@material-tailwind/react';
import React from 'react';

interface CostInputProps {
  cost: number | undefined;
  setOrder: React.Dispatch<React.SetStateAction<any>>;
  disabled: boolean;
}

const CostInput: React.FC<CostInputProps> = ({ cost, setOrder, disabled }) => {
  return (
    <div className="flex flex-col">
      <label htmlFor="cost" className="text-sm font-medium text-slate-700">
        التكلفة
      </label>
      <Input
        type="number"
        id="cost"
        step="0.01"
        value={cost !== undefined ? cost.toString() : ''}
        onChange={(e) => {
          const value = e.target.value;
          if (value === '') {
            setOrder((prev: any) => ({ ...prev, cost: undefined }));
          } else {
            const numValue = parseFloat(value);
            setOrder((prev: any) => ({ ...prev, cost: isNaN(numValue) ? undefined : numValue }));
          }
        }}
        className="block w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        placeholder="0.00"
        required={false}
        disabled={disabled}
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
        crossOrigin={undefined}
      />
    </div>
  );
};

export default CostInput;