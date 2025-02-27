import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from "react";
import { useError } from "../context/ErrorContext";
import { Customer } from "../types/customer";
import IconButton from "./IconButton";
import { OrderList } from "../types/order";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import Modal from "./modal";
import EditCustomer from "./EditCustomer";
import { Input, Option, Select } from "@material-tailwind/react";
import { getCurrentLocation } from "../services/locationService";

interface LocationSelectorProps {
  order: OrderList | undefined;
  setOrder: React.Dispatch<React.SetStateAction<any>>;
  disabled: boolean;
  customer: Customer | undefined;
  isNewCustomer: boolean;
}

export interface LocationSelectorRef {
  resetState: () => void; // Expose this method to the parent
  activateGpsLocation: () => void; // Expose this method to the parent
}

const LocationSelector = forwardRef<LocationSelectorRef, LocationSelectorProps>(
  (
    { order, setOrder, disabled, customer, isNewCustomer },
    ref // Accept the ref as the second argument
  ) => {
    const { dispatch } = useError();
    const [isAddingLocation, setIsAddingLocation] = useState(false);
    const [isAddingGPSLocation, setIsAddingGPSLocation] = useState(false);
    const [gpsLocation, setGpsLocation] = useState<{ coordinates: string; description: string } | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const childRef = useRef<any>(null);
    const [gpsLocationName, setGpsLocationName]  = useState('')
    // Use useImperativeHandle to expose methods to the parent
    useImperativeHandle(ref, () => ({
      resetState: () => {
        setIsAddingLocation(false);
        setIsAddingGPSLocation(false);
        setGpsLocation(undefined);
      },
      activateGpsLocation: async () =>{
        await handleGetCurrentLocation()
      },
      setNewLocationName:  setNewLocationName,
      getNewLocationName: gpsLocationName
    }));

    const buildOptions = () => {
      const t = customer?.locations
        ? customer.locations.map((location) => (
            <Option key={location.id} value={location.id}>
              {location.name}
            </Option>
          ))
        : [<Option key="default">اختر الموقع (اختياري)</Option>];
      return t;
    };

    useEffect(() => {
      if (!isNewCustomer) {
        setIsAddingLocation(false);
        setIsAddingGPSLocation(false);
      }
    }, [isNewCustomer]);

  const setNewLocationName = (newLocationName: string) => {
      if (gpsLocation) {
        const newLocation = {
          id: 0, // ID for a new location
          name: newLocationName,
          coordinates: gpsLocation.coordinates,
          description: gpsLocation.description,
        };
        setOrder((prev) => {
          const updatedOrder ={
            ...prev,
            customer: {
              ...prev.customer,
              locations: [...(prev.customer?.locations ?? []), newLocation],
            },
            location: newLocation, // Ensure this is updated
          };
          return updatedOrder;
      });
    
    
        setIsAddingLocation(false);
        setIsAddingGPSLocation(false);
      }
    };
    

    const handleGetCurrentLocation = async () => {
      try {
        const { coordinates, error } = await getCurrentLocation();

        if (error) {
          dispatch({ type: "SET_ERROR", payload: error });
          return;
        }

        if (coordinates) {
          const locations = customer?.locations?.filter(
            (location) => location.coordinates === coordinates
          );

          if (locations?.length) {
            setOrder((prev) => ({ ...prev, LocationId: locations[0].id }));
            dispatch({
              type: "SET_ERROR",
              payload: "تم استخدام هذا الموقع مسبقًا.",
            });
            setIsAddingLocation(false);
            return;
          } else {
            setIsAddingLocation(true);
            setIsAddingGPSLocation(true);
            setGpsLocation({
              coordinates,
              description: "",
            });
          }
        }
      } catch (unexpectedError) {
        dispatch({ type: "SET_ERROR", payload: "حدث خطأ غير متوقع." });
      }
    };

    const handleSaveCustomer = (updatedCustomer: Customer) => {
      setOrder((prev) => ({ ...prev, customer: updatedCustomer }));
      setIsModalOpen(false);
    };

    return (
      !disabled && (
        <div className="flex flex-col">
          <label className="text-sm font-medium text-slate-700">الموقع</label>
          {!isAddingLocation &&customer?.locations?.length   ? (
            <Select
            key={JSON.stringify(customer?.locations)} // Force re-render when locations change
              value={order?.location?.id}
              onChange={(e) => {
                setOrder((prev) => ({ ...prev, location: { id: e } }));
              }}
              disabled={!customer?.locations?.length || disabled}
              className="block w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder={undefined}
            >
              {buildOptions()}
            </Select>
          ) : (
            <>
              {isAddingGPSLocation && (
                <div>
                  <Input
                    type="text"
                    className="block w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder="أدخل اسم الموقع"
                    value={gpsLocationName}
                    onChange={e => setGpsLocationName(e.target.value)}
                    required 
                    autoFocus
                  />
                </div>
              )}
            </>
          )}
          {customer && !isNewCustomer && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={disabled}
              className="mt-2 text-sm text-primary-500 hover:underline"
            >
              إضافة موقع جديد
            </button>
          )}
          {(!customer?.locations?.length || !order?.location?.id) && (
            <p className="text-gray-500 text-sm mt-1">
              سيتم استخدام موقعك الحالي عند التأكيد.
            </p>
          )}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={disabled}
            className="mt-2 text-sm text-primary-500 hover:underline"
          >
            استخدام الموقع الحالي
          </button>

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