import React, {useState, useRef, useEffect } from "react";
import { Customer, Location } from "../types/customer";
import { OrderList } from "../types/order";
import Modal from "./modal";
import EditCustomer from "./EditCustomer";
import { SearchableDropdown, Option } from "./distributor/shared/SearchableDropdown";
import { AddLocationModal } from "./AddLocationModal";

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
    const [selectedLocationName, setSelectedLocationName] = useState("");
    const childRef = useRef<any>(null);
    
    useEffect(() => {
      if (order?.location?.name) {
        setSelectedLocationName(order.location.name);
      }
    }, [order?.location?.name]);

    const setNewLocationName = (newLocationName: string) => {
      if (newLocationName.trim() !== '') {
        // Check if the location already exists
        const existingLocation = customer?.locations?.some(
          (location) => location.name === newLocationName
        );
    
        if (existingLocation) {
          return;
        }
    
        // Create new location object
        const newLocation: Location = {
          id: 0, // ID for a new location
          name: newLocationName,
          coordinates: '',
          description: ''
        };
    
        // Update state with the new location and customer
        setOrder((prev: OrderList | undefined) => {
          if (!prev) return prev;
          const updatedCustomer = {
            ...prev.customer,
            locations: [...(prev.customer?.locations ?? []), newLocation],
          };
          return {
            ...prev,
            customer: updatedCustomer,
            location: newLocation,
            locationId: newLocation.id
          };
        });
        setSelectedLocationName(newLocationName);
      }
    };
    
    const handleSaveCustomer = (updatedCustomer: Customer) => {
      setOrder((prev: OrderList | undefined) => {
        if (!prev) return prev;
        return { ...prev, customer: updatedCustomer };
      });
      setIsModalOpen(false);
    };

    const handleLocationSelect = (value: string | number) => {
      if (!customer) return;
      
      const locationId = parseInt(value.toString());
      const selectedLocation = customer.locations.find(loc => loc.id === locationId);
      if (!selectedLocation) return;
      
      setOrder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          location: selectedLocation,
          locationId: locationId
        };
      });
      setSelectedLocationName(selectedLocation.name);
    };

    const handleAddLocation = (newLocationName: string) => {
      setNewLocationName(newLocationName);
    };

    // If no customer is selected yet, or customer has no locations array, show empty state
    if (!customer?.locations) {
      return (
        <div className="flex flex-col">
          <label htmlFor="location" className="text-sm font-medium text-slate-700">
            الموقع
          </label>
          <SearchableDropdown
            value={selectedLocationName}
            onChange={() => {}}
            disabled={true}
            placeholder={customer ? "لا توجد مواقع متاحة" : "الرجاء اختيار العميل أولاً"}
            className="block w-full"
          >
            <Option value="" key="empty">لا توجد مواقع</Option>
          </SearchableDropdown>
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        <label htmlFor="location" className="text-sm font-medium text-slate-700">
          الموقع
        </label>
        <SearchableDropdown
          value={selectedLocationName}
          onChange={handleLocationSelect}
          onAddOption={!disabled ? handleAddLocation : undefined}
          disabled={disabled}
          placeholder="اختر الموقع"
          className="block w-full"
        >
          {customer.locations.map(location => (
            <Option key={location.id} value={location.id.toString()}>
              {location.name}
            </Option>
          ))}
        </SearchableDropdown>
        
        {/* Add Location Modal */}
        <AddLocationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={(location) => handleAddLocation(location.name)}
        />
      </div>
    );
};

export default LocationSelector;