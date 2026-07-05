import React, { useEffect, useState } from "react";
import { fetchCharges, updateVehicleCharges } from "../../../api/admin.api";
import { VEHICLE_TYPES } from "../../../constants";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import Table from "../../../components/common/Table";

export const Charges = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [chargesData, setChargesData] = useState(null);

  // Form: Vehicle pricing states
  const [vehicleType, setVehicleType] = useState("1"); // 1, 2, 3, 4
  const [baseDistance, setBaseDistance] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [perKmPrice, setPerKmPrice] = useState("");
  const [waitingCharge, setWaitingCharge] = useState("");
  const [dpComm, setDpComm] = useState("");
  const [pdcComm, setPdcComm] = useState("");
  const [maxWeight, setMaxWeight] = useState("");
  const [maxHeight, setMaxHeight] = useState("");
  const [maxWidth, setMaxWidth] = useState("");
  const [maxLength, setMaxLength] = useState("");
  const [dimensionUnit, setDimensionUnit] = useState("cm");
  const [isUpdatingVehicle, setIsUpdatingVehicle] = useState(false);

  const vehicleNameMap = {
    1: VEHICLE_TYPES.BY_HAND,
    2: VEHICLE_TYPES.TWO_WHEELER,
    3: VEHICLE_TYPES.THREE_WHEELER,
    4: VEHICLE_TYPES.FOUR_WHEELER,
  };

  const headers = [
    "Vehicle",
    "Base Dist.",
    "Base Price",
    "Per KM",
    "Waiting Char.",
    "DP Comm.",
    "PDC Comm.",
    "Capacity",
  ];

  const loadCharges = async () => {
    setIsLoading(true);
    try {
      const response = await fetchCharges();
      const data = response.data?.data || response.data;
      if (data) {
        setChargesData(data);
        prefillVehicleForm(data.vehicle_charges, vehicleType);
      }
    } catch (e) {
      console.error("Failed to load charges", e);
    } finally {
      setIsLoading(false);
    }
  };

  const prefillVehicleForm = (vehicleCharges, typeId) => {
    if (!vehicleCharges) return;
    const mappedName = vehicleNameMap[typeId];
    const target = vehicleCharges.find(
      (vc) =>
        vc.vehicle_type === typeId ||
        vc.vehicle_type === mappedName ||
        vc.id === typeId ||
        vc.id === parseInt(typeId),
    );
    if (target) {
      setBaseDistance(target.base_distance || "");
      setBasePrice(target.base_price || "");
      setPerKmPrice(target.per_km_price || "");
      setWaitingCharge(target.waiting_charge || "");
      setDpComm(target.dp_commission !== undefined ? target.dp_commission : "");
      setPdcComm(
        target.pdc_commission !== undefined ? target.pdc_commission : "",
      );
      setMaxWeight(target.max_weight || "");
      setMaxHeight(target.max_height || "");
      setMaxWidth(target.max_width || "");
      setMaxLength(target.max_length || "");
      setDimensionUnit(target.dimension_unit || "cm");
    } else {
      setBaseDistance("");
      setBasePrice("");
      setPerKmPrice("");
      setWaitingCharge("");
      setDpComm("");
      setPdcComm("");
      setMaxWeight("");
      setMaxHeight("");
      setMaxWidth("");
      setMaxLength("");
      setDimensionUnit("cm");
    }
  };

  useEffect(() => {
    loadCharges();
  }, []);

  const handleVehicleTypeChange = (e) => {
    const val = e.target.value;
    setVehicleType(val);
    if (chargesData && chargesData.vehicle_charges) {
      prefillVehicleForm(chargesData.vehicle_charges, val);
    }
  };

  const handleSaveVehicleCharges = async (e) => {
    e.preventDefault();
    setIsUpdatingVehicle(true);

    // Ensure we send the actual vehicle name (e.g. "Two Wheeler") instead of "2"
    // to match the existing database records and prevent duplicates.
    const mappedType = vehicleNameMap[vehicleType] || vehicleType;

    try {
      await updateVehicleCharges({
        vehicle_type: mappedType,
        base_distance: parseFloat(baseDistance),
        base_price: parseFloat(basePrice),
        per_km_price: parseFloat(perKmPrice),
        waiting_charge: parseFloat(waitingCharge) || 0,
        dp_commission: parseFloat(dpComm),
        pdc_commission: parseFloat(pdcComm),
        max_weight: parseFloat(maxWeight) || 0,
        max_height: parseFloat(maxHeight) || 0,
        max_width: parseFloat(maxWidth) || 0,
        max_length: parseFloat(maxLength) || 0,
        dimension_unit: dimensionUnit,
      });
      alert("Vehicle configuration updated successfully!");
      loadCharges();
    } catch (e) {
      console.error(e);
      alert("Failed to update vehicle parameters");
    } finally {
      setIsUpdatingVehicle(false);
    }
  };

  return (
    <div className="space-y-6 text-left page-transition">
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          Charges Configuration
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure partner commissions, package delivery fees, and per-vehicle
          rates dynamically.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="xl:col-span-1">
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-5">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Edit Configuration
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Select a vehicle type to customize its specific payout
                structure.
              </p>
            </div>

            <form onSubmit={handleSaveVehicleCharges} className="space-y-5">
              <div className="flex flex-col group">
                <label className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide group-focus-within:text-brand-purple transition-colors">
                  Vehicle Type
                </label>
                <div className="relative">
                  <select
                    value={vehicleType}
                    onChange={handleVehicleTypeChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple font-semibold text-slate-700 cursor-pointer"
                  >
                    <option value="1">{VEHICLE_TYPES.BY_HAND}</option>
                    <option value="2">{VEHICLE_TYPES.TWO_WHEELER}</option>
                    <option value="3">{VEHICLE_TYPES.THREE_WHEELER}</option>
                    <option value="4">{VEHICLE_TYPES.FOUR_WHEELER}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <Input
                    label="Base Distance (KM)"
                    id="baseDistance"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 2"
                    value={baseDistance}
                    onChange={(e) => setBaseDistance(e.target.value)}
                    required
                  />
                </div>
                <div className="group">
                  <Input
                    label="Base Price (₹)"
                    id="basePrice"
                    type="number"
                    placeholder="e.g. 30"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <Input
                    label="Per KM Price (₹)"
                    id="perKmPrice"
                    type="number"
                    placeholder="e.g. 10"
                    value={perKmPrice}
                    onChange={(e) => setPerKmPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="group">
                  <Input
                    label="Waiting Charge/Min.(₹)"
                    id="waitingCharge"
                    type="number"
                    placeholder="e.g. 15"
                    value={waitingCharge}
                    onChange={(e) => setWaitingCharge(e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                  Commission Distribution
                </h4>

                <div className="space-y-4">
                  <div className="group relative">
                    <Input
                      label="DP Commission (%)"
                      id="dpComm"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 35"
                      value={dpComm}
                      onChange={(e) => setDpComm(e.target.value)}
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
                      value={pdcComm}
                      onChange={(e) => setPdcComm(e.target.value)}
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
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Max Weight (kg)"
                      id="maxWeight"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 50"
                      value={maxWeight}
                      onChange={(e) => setMaxWeight(e.target.value)}
                    />
                    <div className="flex flex-col text-left">
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                        Dimension Unit
                      </label>
                      <select
                        value={dimensionUnit}
                        onChange={(e) => setDimensionUnit(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple"
                      >
                        <option value="cm">cm</option>
                        <option value="m">m</option>
                        <option value="ft">ft</option>
                        <option value="inch">inch</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Height"
                      id="maxHeight"
                      type="number"
                      step="0.1"
                      placeholder="H"
                      value={maxHeight}
                      onChange={(e) => setMaxHeight(e.target.value)}
                    />
                    <Input
                      label="Width"
                      id="maxWidth"
                      type="number"
                      step="0.1"
                      placeholder="W"
                      value={maxWidth}
                      onChange={(e) => setMaxWidth(e.target.value)}
                    />
                    <Input
                      label="Length"
                      id="maxLength"
                      type="number"
                      step="0.1"
                      placeholder="L"
                      value={maxLength}
                      onChange={(e) => setMaxLength(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  isLoading={isUpdatingVehicle}
                  variant="primary"
                  size="sm"
                  className="w-full py-2.5"
                >
                  Save Configuration
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Table Column */}
        <div className="xl:col-span-2">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4">
              Active Delivery Profiles
            </h3>

            <Table
              headers={headers}
              data={chargesData?.vehicle_charges || []}
              isLoading={isLoading}
              emptyMessage="No vehicle charges parameterized yet."
              renderRow={(item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 transition-colors group border-b last:border-0 border-slate-50"
                >
                  <td className="px-5 py-4 text-xs font-bold text-slate-800 whitespace-nowrap">
                    {vehicleNameMap[item.vehicle_type] || item.vehicle_type}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                    {item.base_distance} KM
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-slate-700 whitespace-nowrap">
                    ₹ {item.base_price.toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-brand-purple whitespace-nowrap">
                    ₹ {item.per_km_price.toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-orange-600 whitespace-nowrap">
                    ₹ {(item.waiting_charge || 0).toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-blue-600 bg-blue-50/30 group-hover:bg-blue-50/60 transition-colors whitespace-nowrap">
                    {item.dp_commission}%
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-emerald-600 bg-emerald-50/30 group-hover:bg-emerald-50/60 transition-colors whitespace-nowrap">
                    {item.pdc_commission}%
                  </td>
                  <td className="px-5 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                    {item.max_weight ? `${item.max_weight}kg` : "-"}
                    {item.max_height || item.max_width || item.max_length
                      ? ` • ${item.max_length || 0}x${item.max_width || 0}x${item.max_height || 0} ${item.dimension_unit || "cm"}`
                      : ""}
                  </td>
                </tr>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charges;
