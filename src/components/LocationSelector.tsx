import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from "react";
import { useError } from "../context/ErrorContext";
import { Customer } from "../types/customer";
import { OrderList } from "../types/order";
import Modal from "./modal";
import EditCustomer from "./EditCustomer";
import { getCurrentLocation } from "../services/locationService";
import { SearchableDropdown ,Option } from "./distributor/shared/SearchableDropdown";
import IconButton from "./IconButton";
import { faCheckCircle, faCross, faMapLocationDot, faTimes } from "@fortawesome/free-solid-svg-icons";

interface LocationSelectorProps {
  order: OrderList | undefined;
  setOrder: React.Dispatch<React.SetStateAction<any>>;
  disabled: boolean;
  customer: Customer | undefined;
  isNewCustomer: boolean;
  isDistributor?: boolean;
}

export interface LocationSelectorRef {
  resetState: () => void; // Expose this method to the parent
  activateGpsLocation: () => void; // Expose this method to the parent
}

const LocationSelector = forwardRef<LocationSelectorRef, LocationSelectorProps>(
  (
    { order, setOrder, disabled, customer, isNewCustomer, isDistributor },
    ref // Accept the ref as the second argument
  ) => {
    const { dispatch } = useError();
    const [gpsLocation, setGpsLocation] = useState<{ coordinates: string; description: string } | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const childRef = useRef<any>(null);
    const [gpsLocationName, setGpsLocationName]  = useState('')
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isInputVisible, setIsInputVisible] = useState(false);
    const [locationName, setLocationName] = useState('');
    
    const handleCheckClick = () => {
      setGpsLocationName(locationName); // Set GPS Location name
      handleGetCurrentLocation(); // Handle getting the current location
      setIsInputVisible(false); // Hide the input after handling the location
    };
    // Use useImperativeHandle to expose methods to the parent
    useImperativeHandle(ref, () => ({
      resetState: () => {
        setGpsLocation(undefined);
      },
      activateGpsLocation: async () =>{
        await handleGetCurrentLocation()
      },
      setNewLocationName:  setNewLocationName,
      getNewLocationName: gpsLocationName
    }));

 

 
    const setNewLocationName = (newLocationName: string) => {
      if (gpsLocation && newLocationName.trim() !== '') {
        // Check if the location already exists
        const existingLocation = customer?.locations?.some(
          (location) => 
            JSON.stringify(location.coordinates) === JSON.stringify(gpsLocation.coordinates)
          || location.name === newLocationName
        );
    
        if (existingLocation) {
          // Reset GPS location and return
          setGpsLocation(undefined);
          return;
        }
    
        // Create new location object
        const newLocation = {
          id: 0, // ID for a new location
          name: newLocationName,
          coordinates: gpsLocation.coordinates,
          description: gpsLocation.description,
        };
    
        // Update state with the new location
        setOrder((prev) => ({
          ...prev,
          customer: {
            ...prev.customer,
            locations: [...(prev.customer?.locations ?? []), newLocation],
          }        }));
        setOrder((prev) => ({
          ...prev,
          location: newLocation, // Ensure this is updated
        }));
      }
    };
    
    
    // Use effect to trigger location setting
    useEffect(() => {
      setNewLocationName(gpsLocationName);
    }, [gpsLocation, gpsLocationName]);
    
const handleGetCurrentLocation = async () => {
  try {
    setLocationError(null); // Reset error before trying
    const { coordinates, error } = await getCurrentLocation();

    if (error) {
      setLocationError(error);
      dispatch({ type: "SET_ERROR", payload: error });
      return;
    }

    if (coordinates) {
      const existingLocation = customer?.locations?.find(
        (location) => location.coordinates === coordinates
      );

      if (existingLocation) {
        setOrder((prev) => ({ ...prev, LocationId: existingLocation.id,location:{id:existingLocation.id} }));
        dispatch({
          type: "SET_ERROR",
          payload: "تم استخدام هذا الموقع مسبقًا.",
        });
      } else {
        setGpsLocation({
          coordinates,
          description: "",
        });
      }
    }
  } catch (unexpectedError) {
    setLocationError("حدث خطأ غير متوقع.");
    dispatch({ type: "SET_ERROR", payload: "حدث خطأ غير متوقع." });
  }
};
    // Auto-activate GPS location for distributors with new customers
    useEffect(() => {
      if (isDistributor && isNewCustomer && !gpsLocation) {
        handleGetCurrentLocation();
      }
    }, [isDistributor, isNewCustomer]);

    const handleSaveCustomer = (updatedCustomer: Customer) => {
      setOrder((prev) => ({ ...prev, customer: updatedCustomer }));
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
            setOrder((prev) => ({ ...prev, location: { id: e } }));
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

       {!isInputVisible &&( <IconButton icon={faMapLocationDot} onClick={(e) => {
          e.preventDefault();
          setIsInputVisible(true)
        }}>
        </IconButton>)}
      </div>

      {isInputVisible && (
          <div className="flex items-center space-x-2">
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            className="block w-full p-2 border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="ادخل اسم الموقع"
          />
          <IconButton
            icon={faCheckCircle}
            onClick={(e) =>{e.preventDefault(); handleCheckClick();}}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            
          </IconButton>
          <IconButton
            icon={faTimes}
            variant="danger"
            onClick={(e) =>{e.preventDefault(); setIsInputVisible(false);}}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            
          </IconButton>
        </div>
      )}
            {gpsLocationName && !gpsLocation && (
  <button
    type="button"
    onClick={handleGetCurrentLocation}
    className="mt-2 text-sm text-red-500 hover:underline"
  >
    إعادة المحاولة لتحديد الموقع
  </button>
)}

{locationError && (
  <p className="text-red-500 text-sm mt-1">{locationError}</p>
)}
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
          {isModalOpen && customer && (
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="تعديل بيانات الزبون"
              onConfirm={() => {
                if (childRef.current) {
                  childRef.current.saveChanges(); // Call saveChanges via ref
                }
              }}
            >
              <EditCustomer
                ref={childRef} // Pass the ref to EditCustomer
                customerId={customer?.id?.toString()}
                onCustomerUpdated={handleSaveCustomer}
                onCloseModal={() => setIsModalOpen(false)}
              />
            </Modal>
          )}
        </div>
      )
    );
  }
);

export default LocationSelector;