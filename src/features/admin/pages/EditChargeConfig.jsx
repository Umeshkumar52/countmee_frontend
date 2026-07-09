import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchCharges, updateVehicleCharges } from "../../../api/admin.api";
import { VEHICLE_TYPES } from "../../../constants";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import toast from "react-hot-toast";

const EditChargeConfig = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialVehicleId = searchParams.get("vehicle") || "1";

  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingVehicle, setIsUpdatingVehicle] = useState(false);
  const [chargesData, setChargesData] = useState(null);
  const [vehicleType, setVehicleType] = useState(initialVehicleId);

  // Unified form state
  const [formData, setFormData] = useState({
    baseDistance: "",
    basePrice: "",
    perKmPrice: "",
    extraMinCharge: "",
    gracePeriod: "",
    pickupGeofenceRadius: "",
    dpComm: "",
    pdcComm: "",
    maxWeight: "",
    maxHeight: "",
    maxWidth: "",
    maxLength: "",
    dimensionUnit: "cm",
  });

  const vehicleNameMap = useMemo(
    () => ({
      1: VEHICLE_TYPES.BY_HAND,
      2: VEHICLE_TYPES.TWO_WHEELER,
      3: VEHICLE_TYPES.THREE_WHEELER,
      4: VEHICLE_TYPES.FOUR_WHEELER,
    }),
    [],
  );

  const loadCharges = async () => {
    setIsLoading(true);
    try {
      const response = await fetchCharges();
      const data = response.data?.data || response.data;
      if (data) {
        setChargesData(data);
      }
    } catch (e) {
      console.error("Failed to load charges", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCharges();
  }, []);

  // Auto-Prefill Hook
  useEffect(() => {
    if (chargesData && chargesData.vehicle_charges) {
      const mappedName = vehicleNameMap[vehicleType];
      const target = chargesData.vehicle_charges.find(
        (vc) =>
          vc.vehicle_type === vehicleType ||
          vc.vehicle_type === mappedName ||
          vc.id === vehicleType ||
          vc.id === parseInt(vehicleType),
      );

      if (target) {
        setFormData({
          baseDistance: target.base_distance || "",
          basePrice: target.base_price || "",
          perKmPrice: target.per_km_price || "",
          extraMinCharge:
            target.extra_min_charge !== undefined
              ? target.extra_min_charge
              : "",
          gracePeriod:
            target.grace_period !== undefined ? target.grace_period : "",
          pickupGeofenceRadius:
            target.pickup_geofence_radius !== undefined
              ? target.pickup_geofence_radius
              : "",
          dpComm:
            target.dp_commission !== undefined ? target.dp_commission : "",
          pdcComm:
            target.pdc_commission !== undefined ? target.pdc_commission : "",
          maxWeight: target.max_weight || "",
          maxHeight: target.max_height || "",
          maxWidth: target.max_width || "",
          maxLength: target.max_length || "",
          dimensionUnit: target.dimension_unit || "cm",
        });
      } else {
        setFormData({
          baseDistance: "",
          basePrice: "",
          perKmPrice: "",
          extraMinCharge: "",
          gracePeriod: "",
          pickupGeofenceRadius: "",
          dpComm: "",
          pdcComm: "",
          maxWeight: "",
          maxHeight: "",
          maxWidth: "",
          maxLength: "",
          dimensionUnit: "cm",
        });
      }
    }
  }, [vehicleType, chargesData, vehicleNameMap]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleVehicleTypeChange = (e) => {
    const val = e.target.value;
    setVehicleType(val);
    setSearchParams({ vehicle: val }, { replace: true });
  };

  const handleSaveVehicleCharges = async (e) => {
    e.preventDefault();
    setIsUpdatingVehicle(true);

    const mappedType = vehicleNameMap[vehicleType] || vehicleType;

    try {
      await updateVehicleCharges({
        vehicle_type: mappedType,
        base_distance: parseFloat(formData.baseDistance),
        base_price: parseFloat(formData.basePrice),
        per_km_price: parseFloat(formData.perKmPrice),
        extra_min_charge: parseFloat(formData.extraMinCharge) || 0,
        grace_period: parseFloat(formData.gracePeriod) || 0,
        pickup_geofence_radius: parseFloat(formData.pickupGeofenceRadius) || 0,
        dp_commission: parseFloat(formData.dpComm),
        pdc_commission: parseFloat(formData.pdcComm),
        max_weight: parseFloat(formData.maxWeight) || 0,
        max_height: parseFloat(formData.maxHeight) || 0,
        max_width: parseFloat(formData.maxWidth) || 0,
        max_length: parseFloat(formData.maxLength) || 0,
        dimension_unit: formData.dimensionUnit,
      });
      toast.success("Vehicle configuration updated successfully!");
      navigate("/admin/charges");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update vehicle parameters");
    } finally {
      setIsUpdatingVehicle(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col items-center page-transition">
      <div className="w-full flex  justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Edit Vehicle Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure partner commissions, package delivery fees, and
            per-vehicle rates.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate("/admin/charges")}
        >
          Back to Profiles
        </Button>
      </div>

      <div className="w-full bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-5 max-w-4xl">
        <form onSubmit={handleSaveVehicleCharges} className=" space-y-5">
          {isLoading && (
            <p className="text-xs text-brand-purple animate-pulse">
              Loading active configuration...
            </p>
          )}

          <div className="flex flex-col group max-w-sm">
            <label className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide group-focus-within:text-brand-purple transition-colors">
              Vehicle Type
            </label>
            <div className="relative">
              <select
                value={vehicleType}
                onChange={handleVehicleTypeChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple font-semibold text-slate-700 cursor-pointer"
              >
                <option value="1">{VEHICLE_TYPES.BY_HAND}</option>
                <option value="2">{VEHICLE_TYPES.TWO_WHEELER}</option>
                <option value="3">{VEHICLE_TYPES.THREE_WHEELER}</option>
                <option value="4">{VEHICLE_TYPES.FOUR_WHEELER}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="group">
              <Input
                label="Base Distance (KM)"
                id="baseDistance"
                type="number"
                step="0.1"
                placeholder="e.g. 2"
                value={formData.baseDistance}
                onChange={handleChange("baseDistance")}
                required
              />
            </div>
            <div className="group">
              <Input
                label="Base Price (₹)"
                id="basePrice"
                type="number"
                placeholder="e.g. 30"
                value={formData.basePrice}
                onChange={handleChange("basePrice")}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="group">
              <Input
                label="Per KM Price (₹)"
                id="perKmPrice"
                type="number"
                placeholder="e.g. 10"
                value={formData.perKmPrice}
                onChange={handleChange("perKmPrice")}
                required
              />
            </div>
            <div className="group">
              <Input
                label="Extra Per Min Charge (₹)"
                id="extraMinCharge"
                type="number"
                placeholder="e.g. 5"
                value={formData.extraMinCharge}
                onChange={handleChange("extraMinCharge")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="group">
              <Input
                label="Grace Period (min)"
                id="gracePeriod"
                type="number"
                placeholder="e.g. 5"
                value={formData.gracePeriod}
                onChange={handleChange("gracePeriod")}
              />
            </div>
            <div className="group">
              <Input
                label="Pickup Geofence (m)"
                id="pickupGeofenceRadius"
                type="number"
                placeholder="e.g. 100"
                value={formData.pickupGeofenceRadius}
                onChange={handleChange("pickupGeofenceRadius")}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
              Commission Distribution
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="group relative">
                <Input
                  label="DP Commission (%)"
                  id="dpComm"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 35"
                  value={formData.dpComm}
                  onChange={handleChange("dpComm")}
                  required
                />
              </div>

              <div className="group relative">
                <Input
                  label="PDC Commission (%)"
                  id="pdcComm"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 15"
                  value={formData.pdcComm}
                  onChange={handleChange("pdcComm")}
                  required
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
              Capacity Limits
            </h4>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Max Weight (kg)"
                  id="maxWeight"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 50"
                  value={formData.maxWeight}
                  onChange={handleChange("maxWeight")}
                />
                <div className="flex flex-col text-left">
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Dimension Unit
                  </label>
                  <select
                    value={formData.dimensionUnit}
                    onChange={handleChange("dimensionUnit")}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple"
                  >
                    <option value="cm">cm</option>
                    <option value="m">m</option>
                    <option value="ft">ft</option>
                    <option value="inch">inch</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Height"
                  id="maxHeight"
                  type="number"
                  step="0.1"
                  placeholder="H"
                  value={formData.maxHeight}
                  onChange={handleChange("maxHeight")}
                />
                <Input
                  label="Width"
                  id="maxWidth"
                  type="number"
                  step="0.1"
                  placeholder="W"
                  value={formData.maxWidth}
                  onChange={handleChange("maxWidth")}
                />
                <Input
                  label="Length"
                  id="maxLength"
                  type="number"
                  step="0.1"
                  placeholder="L"
                  value={formData.maxLength}
                  onChange={handleChange("maxLength")}
                />
              </div>
            </div>
          </div>

          <div className="w-full pt-2  max-w-xs">
            <Button
              type="submit"
              isLoading={isUpdatingVehicle}
              variant="primary"
              size="sm"
              className="px-8 py-2.5"
            >
              Save Configuration
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditChargeConfig;
