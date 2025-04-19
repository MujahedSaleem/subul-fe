import React, {useState, useRef,  } from "react";
import { Customer } from "../types/customer";
import { OrderList } from "../types/order";
import Modal from "./modal";
import EditCustomer from "./EditCustomer";
import { SearchableDropdown ,Option } from "./distributor/shared/SearchableDropdown";

interface LocationSelectorProps {
  order: OrderList | undefined;
  setOrder: React.Dispatch<React.SetStateAction<OrderList | undefined>>;
  disabled: boolean;
  customer: Customer | undefined;
  isNewCustomer: boolean;
  isDistributor?: boolean;
}

const LocationSelector : React.FC<LocationSelectorProps> =(
  { order, setOrder, disabled, customer, isNewCustomer, isDistributor },
) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const childRef = useRef<any>(null);
    const setNewLocationName = (newLocationName: string) => {
      if (newLocationName.trim() !== '') {
        // Check if the location already exists
        const existingLocation = customer?.locations?.some(
          (location) => 
            JSON.stringify(location.coordinates) === JSON.stringify('')
          || location.name === newLocationName
        );
    
        if (existingLocation) {
          return;
        }
    
        // Create new location object
        const newLocation = {
          id: 0, // ID for a new location
          name: newLocationName,
          coordinates: '',
          description: '',
        };
    
        // Update state with the new location
        setOrder((prev: OrderList | undefined) => {
          if (!prev) return prev;
          return {
            ...prev,
            customer: {
              ...prev.customer,
              locations: [...(prev.customer?.locations ?? []), newLocation],
            }
          };
        });
        setOrder((prev: OrderList | undefined) => {
          if (!prev) return prev;
          return {
            ...prev,
            location: newLocation,
          };
        });
      }
    };
    
    const handleSaveCustomer = (updatedCustomer: Customer) => {
      setOrder((prev: OrderList | undefined) => {
        if (!prev) return prev;
        return { ...prev, customer: updatedCustomer };
      });
      setIsModalOpen(false);
    };

    return (
      !disabled && (
        <div className="flex flex-col">
          <label className="text-sm font-medium text-slate-700">الموقع</label>
          <div className="flex items-center space-x-2">
        <SearchableDropdown
          key={JSON.stringify(customer?.locations)} // Force re-render when locations change
          value={order?.location?.name}
          onChange={(e) => {
            // Find the selected location from customer's locations
            const selectedLocation = customer?.locations?.find(loc => loc.id === e);
            if (selectedLocation) {
              setOrder((prev: OrderList | undefined) => {
                if (!prev) return prev;
                return { 
                  ...prev, 
                  location: selectedLocation 
                };
              });
            }
          }}
          onAddOption={(newLocation) => {
            setNewLocationName(newLocation);
          }}
          disabled={disabled}
          className="block w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ease-in-out"
        >
          {customer?.locations?.filter(location => location?.name?.trim()).map((location) => (
            <Option key={location.id} value={location.id}>
              {location.name}
            </Option>
          ))}
        </SearchableDropdown>
      </div>

          {customer && !isNewCustomer && !isDistributor && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={disabled}
              className="mt-2 text-sm text-primary-500 hover:underline"
            >
              إضافة موقع جديد
            </button>
          )}
    
          {/* Modal for Editing Customer */}
          {isModalOpen && (
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="تعديل بيانات العميل"
            >
              <EditCustomer
                customerId={customer?.id?.toString() ?? ''}
                onCustomerUpdated={handleSaveCustomer}
                onCloseModal={() => setIsModalOpen(false)}
                ref={childRef}
              />
            </Modal>
          )}
        </div>
      )
    );
};

export default LocationSelector;