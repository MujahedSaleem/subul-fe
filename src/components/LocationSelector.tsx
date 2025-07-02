import React, { useState, useEffect, forwardRef } from "react";
import { Customer, Location } from "../types/customer";
import { OrderList } from "../types/order";
import Modal from "./modal";
import EditCustomer from "./EditCustomer";
import { SearchableDropdown, Option } from "./distributor/shared/SearchableDropdown";
import { AddLocationModal } from "./AddLocationModal";
import IconButton from "./IconButton";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";

interface LocationSelectorProps {
  order: OrderList | undefined;
  setOrder: React.Dispatch<React.SetStateAction<OrderList | undefined>>;
  disabled: boolean;
  customer: Customer | undefined;
  isNewCustomer: boolean;
  isDistributor?: boolean;
}

const LocationSelector = forwardRef<HTMLDivElement, LocationSelectorProps>((
  { order, setOrder, disabled, customer, isNewCustomer, isDistributor },
  ref
) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLocationName, setSelectedLocationName] = useState("");
    
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
          address: '',
          isActive: true,
          customerId: customer?.id || ''
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

    const handleInputChange = (inputValue: string) => {
      // If input is being cleared and we have a current location
      if (inputValue.trim() === '' && order?.location) {
        const currentLocation = order.location;
        
        // Create empty location object to clear selection
        const emptyLocation: Location = {
          id: 0,
          name: '',
          coordinates: '',
          address: '',
          isActive: true,
          customerId: customer?.id || ''
        };
        
        // If it's a new location (id = 0), remove it from customer's locations
        if (currentLocation.id === 0) {
          setOrder((prev: OrderList | undefined) => {
            if (!prev || !prev.customer) return prev;
            
            const updatedCustomer = {
              ...prev.customer,
              locations: prev.customer.locations.filter(loc => 
                !(loc.id === 0 && loc.name === currentLocation.name)
              )
            };
            
            return {
              ...prev,
              customer: updatedCustomer,
              location: emptyLocation,
              locationId: 0
            };
          });
        } else {
          // If it's an existing location, just clear the selection
          setOrder((prev: OrderList | undefined) => {
            if (!prev) return prev;
            return {
              ...prev,
              location: emptyLocation,
              locationId: 0
            };
          });
        }
        setSelectedLocationName('');
      }
    };

    const handleOpenLocation = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!order?.location?.coordinates) {
        alert('لا توجد إحداثيات متوفرة لهذا الموقع');
        return;
      }

      const [latitude, longitude] = order.location.coordinates.split(',').map(Number);
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobileDevice) {
        // For mobile, use navigation URL that opens in driving mode
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
        window.open(googleMapsUrl, '_blank');
      } else {
        // For desktop, open in navigation/driving mode
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
        window.open(url, '_blank');
      }
    };


    return (
      <div ref={ref} className="flex flex-col">
        <label htmlFor="location" className="text-sm font-medium text-slate-700">
          الموقع
        </label>
        <div className="flex items-center gap-2">
          <SearchableDropdown
            value={selectedLocationName}
            onChange={handleLocationSelect}
            onAddOption={!disabled ? handleAddLocation : undefined}
            onInputChange={!disabled ? handleInputChange : undefined}
            disabled={disabled}
            placeholder="اختر الموقع"
            className="flex-1"
          >
            {customer?.locations?.map(location => (
              <Option key={location.id} value={location.id.toString()}>
                {location.name}
              </Option>
            ))}
          </SearchableDropdown>
          
          {/* Location button - only show when coordinates exist */}
          {order?.location?.coordinates && (
            <IconButton 
              onClick={handleOpenLocation}
              icon={faLocationDot}
              variant="primary"
              size="md"
              title="فتح الموقع في خريطة جوجل"
            />
          )}
        </div>

        {/* Add Location Modal */}
        <AddLocationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={(location) => handleAddLocation(location.name)}
        />
      </div>
    );
});

LocationSelector.displayName = 'LocationSelector';

export default LocationSelector;