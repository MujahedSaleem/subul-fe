import React from "react";
import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import Button from "./Button";
import IconButton from "./IconButton";
import { Input } from "@material-tailwind/react";

interface Location {
  id: number;
  name: string;
  coordinates: string;
  description: string;
}

interface LocationsSectionProps {
  locations: Location[];
  addLocation: () => void;
  removeLocation: (id: number) => void;
  updateLocation: (id: number, field: keyof Location, value: string) => void;
}

const LocationsSection: React.FC<LocationsSectionProps> = ({
  locations,
  addLocation,
  removeLocation,
  updateLocation,
}) => {
  return (
    <div className="space-y-4 mt-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">المواقع</h2>
        <Button onClick={addLocation} variant="primary" icon={faPlus}>
          إضافة موقع
        </Button>
      </div>

      {/* Location Fields */}
      <div className="space-y-4">
        {locations.length > 0 ? (
          locations.map((location) => (
            <div
              key={location.id}
              className="bg-slate-50 p-4 rounded-lg space-y-3"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium text-slate-700">
                  موقع {location.id}
                </h3>
                <IconButton
                  onClick={() => removeLocation(location.id)}
                  variant="danger"
                  icon={faXmark}
                />
              </div>
              <div className="space-y-3">
                {/* Location Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    اسم الموقع
                  </label>
                  <Input
                    type="text"
                    value={location.name}
                    onChange={(e) =>
                      updateLocation(location.id, "name", e.target.value)
                    }
                    className="block w-full border border-slate-200 rounded-lg py-2 px-3 focus:ring-primary-500/20 focus:border-primary-500"
                    required
                  />
                </div>

                {/* Coordinates */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    الإحداثيات (خط الطول، خط العرض)
                  </label>
                  <Input
                    type="text"
                    value={location.coordinates}
                    onChange={(e) =>
                      updateLocation(location.id, "coordinates", e.target.value)
                    }
                    className="block w-full border border-slate-200 rounded-lg py-2 px-3 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder="مثال: 31.2357, 30.0444"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    الوصف
                  </label>
                  <textarea
                    value={location.description}
                    onChange={(e) =>
                      updateLocation(location.id, "description", e.target.value)
                    }
                    className="block w-full border border-slate-200 rounded-lg py-2 px-3 min-h-[100px] resize-y focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 italic">
            لم يتم إضافة مواقع بعد
          </p>
        )}
      </div>
    </div>
  );
};

export default LocationsSection;