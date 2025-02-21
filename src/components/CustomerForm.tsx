import React from "react";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import { normalizePhoneNumber } from "../utils/formatters";
import { Customer, Location } from "../types/customer";
import BasicInfoSection from "./BasicInfoSection";
import LocationsSection from "./LocationsSection";

interface CustomerFormProps {
  customer: Customer;
  setCustomer: React.Dispatch<React.SetStateAction<Customer>>;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  showButtons?: boolean; // Flag to control button visibility
  overrideActions?: {
    backAction?: () => void; // Custom back action
    submitAction?: () => void; // Custom submit action
  };
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  setCustomer,
  onSubmit,
  title,
  showButtons = true, // Default to true
  overrideActions,
}) => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedCustomer = {
      ...customer,
      phone: normalizePhoneNumber(customer.phone),
    };
    setCustomer(updatedCustomer);
    onSubmit(e);
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="form-section">
        <div className="form-body">
          {/* Basic Customer Info */}
          <BasicInfoSection
            customer={customer}
            setCustomer={setCustomer}
          />
          {/* Locations Section */}
          <LocationsSection
            locations={customer.locations}
            addLocation={() => {
              const newId =
                Math.max(0, ...customer.locations.map((l) => l.id)) + 1;
              setCustomer({
                ...customer,
                locations: [
                  ...customer.locations,
                  { id: newId, name: "", coordinates: "", description: "" },
                ],
              });
            }}
            removeLocation={(id: number) =>
              setCustomer({
                ...customer,
                locations: customer.locations.filter((loc) => loc.id !== id),
              })
            }
            updateLocation={(id: number, field: keyof Location, value: string) =>
              setCustomer({
                ...customer,
                locations: customer.locations.map((loc) =>
                  loc.id === id ? { ...loc, [field]: value } : loc
                ),
              })
            }
          />
        </div>
        {/* Form Actions */}
        {showButtons && (
          <div className="form-footer">
            <Button
              onClick={overrideActions?.backAction || (() => navigate("/admin/customers"))}
              variant="primary"
              icon={faArrowRight}
            >
              رجوع
            </Button>
            <Button
              type="submit"
              onClick={overrideActions?.submitAction}
              variant="success"
            >
              {title}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default CustomerForm;