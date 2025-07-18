import React, { useState, useEffect, forwardRef } from "react";
import { Customer, Location } from "../types/customer";
import { OrderList } from "../types/order";
import Modal from "./modal";
import EditCustomer from "./EditCustomer";
import IconButton from "./IconButton";
import { faLocationDot, faPlus, faMapMarkerAlt, faPencilAlt, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAppDispatch } from "../store/hooks";
import { showWarning } from "../store/slices/notificationSlice";
import Button from "./Button";

interface LocationSelectorProps {
  order: OrderList | undefined;
  setOrder: React.Dispatch<React.SetStateAction<OrderList | undefined>>;
  disabled: boolean;
  customer: Customer | undefined;
  isNewCustomer: boolean;
  isDistributor?: boolean;
  autoOpenDropdown?: boolean;
}

const LocationSelector = forwardRef<HTMLDivElement, LocationSelectorProps>((
  { order, setOrder, disabled, customer, isNewCustomer, isDistributor, autoOpenDropdown },
  ref
) => {
  const dispatch = useAppDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
  const [editingLocationName, setEditingLocationName] = useState("");
  
  useEffect(() => {
    if (order?.location?.name) {
      setSelectedLocationName(order.location.name);
    }else{
      setSelectedLocationName("اختر الموقع");
    }
  }, [order?.customer, order?.location?.name]);

  // Auto-open modal when there are locations and autoOpenDropdown is true
  useEffect(() => {
    if (autoOpenDropdown && customer?.locations && customer.locations.length > 0 && !disabled) {
      setIsModalOpen(true);
    }
  }, [autoOpenDropdown, customer?.locations, disabled]);

  const setNewLocation = (locationName: string) => {
    if (locationName.trim() !== '') {
      // Check if the location already exists
      const existingLocation = customer?.locations?.some(
        (location) => location.name === locationName
      );
  
      if (existingLocation) {
        return;
      }
  
      // Create new location object
      const newLocation: Location = {
        id: 0, // ID for a new location
        name: locationName,
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
      setSelectedLocationName(locationName);
      setNewLocationName("");
      setIsAddingLocation(false);
    }
  };

  const handleSaveCustomer = (updatedCustomer: Customer) => {
    setOrder((prev: OrderList | undefined) => {
      if (!prev) return prev;
      return { ...prev, customer: updatedCustomer };
    });
    setIsEditModalOpen(false);
  };

  const handleLocationSelect = (location: Location) => {
    if (!customer) return;
    
    // Don't select if we're in edit mode
    if (editingLocationId !== null) {
      return;
    }
    
    setOrder(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        location: location,
        locationId: location.id
      };
    });
    setSelectedLocationName(location.name);
    setIsModalOpen(false);
  };

  const handleAddNewLocation = () => {
    if (newLocationName.trim() !== '') {
      // First add the new location
      setNewLocation(newLocationName);
      
      // Then explicitly close the modal
      setTimeout(() => {
        setIsModalOpen(false);
      }, 0);
    }
  };

  const handleOpenLocationModal = () => {
    if (!disabled) {
      setIsModalOpen(true);
    }
  };

  const handleOpenLocation = (e: React.MouseEvent, coordinates: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!coordinates) {
      dispatch(showWarning({ message: 'لا توجد إحداثيات متوفرة لهذا الموقع' }));
      return;
    }

    const [latitude, longitude] = coordinates.split(',').map(Number);
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobileDevice) {
      // For mobile, use geo: protocol for better app integration
      const googleMapsUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
      window.location.href = googleMapsUrl;
    } else {
      // For desktop, open in navigation/driving mode
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(url, '_blank');
    }
  };

  const handleEditLocation = (e: React.MouseEvent, location: Location) => {
    e.stopPropagation();
    setEditingLocationId(location.id);
    setEditingLocationName(location.name);
  };

  const handleSaveLocationEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!customer || editingLocationId === null || !editingLocationName.trim()) {
      return;
    }

    // Find the location to update
    const locationToUpdate = customer.locations.find(loc => loc.id === editingLocationId);
    if (!locationToUpdate) {
      setEditingLocationId(null);
      return;
    }

    // Create updated location
    const updatedLocation = {
      ...locationToUpdate,
      name: editingLocationName.trim()
    };

    // Update locations array
    const updatedLocations = customer.locations.map(loc => 
      loc.id === editingLocationId ? updatedLocation : loc
    );

    // If the edited location was the selected one, update the selected location name
    if (order?.location?.id === editingLocationId) {
      setSelectedLocationName(updatedLocation.name);
      
      // Update the order with the updated location name and customer locations
      setOrder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          location: {
            ...prev.location!,
            name: updatedLocation.name
          },
          customer: {
            ...prev.customer!,
            locations: updatedLocations
          }
        };
      });
    } else {
      // Only update the customer's locations array
      setOrder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          customer: {
            ...prev.customer!,
            locations: updatedLocations
          }
        };
      });
    }
    
    // Reset editing state
    setEditingLocationId(null);
  };

  const handleCancelLocationEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLocationId(null);
  };

  return (
    <div ref={ref} className="flex flex-col">
      <label htmlFor="location" className="text-sm font-medium text-slate-700 mb-2">
        الموقع
      </label>
      
      {/* Location Display Label */}
      <div className="flex items-center gap-2">
        <div 
          onClick={handleOpenLocationModal}
          className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer transition-colors ${
            disabled 
              ? 'bg-gray-100 cursor-not-allowed' 
              : 'bg-white hover:bg-gray-50'
          } ${
            selectedLocationName ? 'text-gray-800' : 'text-gray-500'
          }`}
        >
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 text-gray-400" />
            <span>
              {selectedLocationName || "اختر الموقع"}
            </span>
          </div>
        </div>
        
        {/* Location button - only show when coordinates exist */}
        {order?.location?.coordinates && (
          <IconButton 
            onClick={(e) => handleOpenLocation(e, order.location.coordinates || '')}
            icon={faLocationDot}
            variant="primary"
            size="md"
            title="فتح الموقع في خريطة جوجل"
          />
        )}
      </div>

      {/* Location Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                اختر الموقع
              </h3>
              
              {/* Existing Locations */}
              {customer?.locations && customer.locations.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {customer.locations.map((location, index) => (
                    <div
                      key={location.id === 0 ? `new-location-${index}-${location.name}` : location.id}
                      onClick={() => handleLocationSelect(location)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                        selectedLocationName === location.name
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 text-gray-400" />
                          {editingLocationId === location.id ? (
                            <input
                              type="text"
                              value={editingLocationName}
                              onChange={(e) => setEditingLocationName(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="text-gray-800">{location.name}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {editingLocationId === location.id ? (
                            <>
                              <IconButton
                                onClick={handleSaveLocationEdit}
                                icon={faCheck}
                                variant="success"
                                size="sm"
                                title="حفظ"
                              />
                              <IconButton
                                onClick={handleCancelLocationEdit}
                                icon={faTimes}
                                variant="danger"
                                size="sm"
                                title="إلغاء"
                              />
                            </>
                          ) : (
                            <IconButton
                              onClick={(e) => handleEditLocation(e, location)}
                              icon={faPencilAlt}
                              variant="secondary"
                              size="sm"
                              title="تعديل الموقع"
                            />
                          )}
                          {location.coordinates && !editingLocationId && (
                            <IconButton
                              onClick={(e) => handleOpenLocation(e, location.coordinates || '')}
                              icon={faLocationDot}
                              variant="primary"
                              size="sm"
                              title="فتح الموقع في خريطة جوجل"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 mb-4">
                  لا توجد مواقع محفوظة
                </div>
              )}

              {/* Add New Location Section */}
              <div className="border-t pt-4">
                {isAddingLocation ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                      placeholder="اسم الموقع الجديد"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddNewLocation}
                        disabled={!newLocationName.trim()}
                        className="flex-1"
                        size="sm"
                      >
                        إضافة
                      </Button>
                      <Button
                        onClick={() => {
                          setIsAddingLocation(false);
                          setNewLocationName("");
                        }}
                        variant="outlined"
                        className="flex-1"
                        size="sm"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsAddingLocation(true)}
                    variant="primary"
                    className="w-full"
                    size="sm"
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-4 h-4 ml-2" />
                    إضافة موقع جديد
                  </Button>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  onClick={() => setIsModalOpen(false)}
                  variant="outlined"
                  size="sm"
                >
                  إغلاق
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="تعديل العميل"
      >
        {customer && (
          <EditCustomer
            customerId={customer.id}
            onCustomerUpdated={handleSaveCustomer}
            onCloseModal={() => setIsEditModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
});

LocationSelector.displayName = 'LocationSelector';

export default LocationSelector;