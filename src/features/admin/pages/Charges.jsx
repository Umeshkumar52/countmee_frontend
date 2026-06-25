import React, { useEffect, useState } from "react";
import {
  fetchCharges,
  updateVehicleCharges,
  updateCommission,
  updatePdcCommission,
} from "../../../api/admin.api";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import Table from "../../../components/common/Table";

export const Charges = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [chargesData, setChargesData] = useState(null);

  // Form 1: Vehicle pricing states
  const [vehicleType, setVehicleType] = useState("1"); // 1, 2, 3, 4
  const [baseDistance, setBaseDistance] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [perKmPrice, setPerKmPrice] = useState("");
  const [isUpdatingVehicle, setIsUpdatingVehicle] = useState(false);

  // Form 2: DP Commission
  const [dpComm, setDpComm] = useState("");
  const [isUpdatingDp, setIsUpdatingDp] = useState(false);

  // Form 3: PDC Commission
  const [pdcComm, setPdcComm] = useState("");
  const [isUpdatingPdc, setIsUpdatingPdc] = useState(false);

  const loadCharges = async () => {
    setIsLoading(true);
    try {
      const response = await fetchCharges();
      const data = response.data.data || response.data;
      if (data) {
        setChargesData(data);
        setDpComm(data.dp_commission || "");
        setPdcComm(data.pdc_commission || "");

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
    const target = vehicleCharges.find((vc) => vc.id === parseInt(typeId));
    if (target) {
      setBaseDistance(target.base_distance || "");
      setBasePrice(target.base_price || "");
      setPerKmPrice(target.per_km_price || "");
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
    try {
      await updateVehicleCharges({
        vehicle_type: vehicleType,
        base_distance: parseFloat(baseDistance),
        base_price: parseFloat(basePrice),
        per_km_price: parseFloat(perKmPrice),
      });
      alert("Vehicle payout parameters updated successfully!");
      loadCharges();
    } catch (e) {
      console.error(e);
      alert("Failed to update vehicle parameters");
    } finally {
      setIsUpdatingVehicle(false);
    }
  };

  const handleSaveDpCommission = async (e) => {
    e.preventDefault();
    setIsUpdatingDp(true);
    try {
      await updateCommission({
        type: "dp",
        commission: parseFloat(dpComm),
      });
      alert("Delivery Partner Commission saved successfully!");
      loadCharges();
    } catch (e) {
      console.error(e);
      alert("Failed to update DP commission");
    } finally {
      setIsUpdatingDp(false);
    }
  };

  const handleSavePdcCommission = async (e) => {
    e.preventDefault();
    setIsUpdatingPdc(true);
    try {
      await updatePdcCommission({
        type: "pdc",
        commission: parseFloat(pdcComm),
      });
      alert("PDC Package Commission saved successfully!");
      loadCharges();
    } catch (e) {
      console.error(e);
      alert("Failed to update PDC commission");
    } finally {
      setIsUpdatingPdc(false);
    }
  };

  return (
    <div className="space-y-6 text-left page-transition">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Charges Settings</h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure partner commissions, package delivery fees, and per-vehicle
          rates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Vehicle Rates setup & Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">
              Vehicle Payout Configuration
            </h3>

            <form
              onSubmit={handleSaveVehicleCharges}
              className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
            >
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-slate-600 mb-1.5">
                  Vehicle Type
                </label>
                <select
                  value={vehicleType}
                  onChange={handleVehicleTypeChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs transition-all outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple cursor-pointer font-medium"
                >
                  <option value="1">By Hand</option>
                  <option value="2">Two Wheeler</option>
                  <option value="3">Three Wheeler</option>
                  <option value="4">Four Wheeler</option>
                </select>
              </div>

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

              <Input
                label="Base Price (₹)"
                id="basePrice"
                type="number"
                placeholder="e.g. 30"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                required
              />

              <Input
                label="Per KM Price (₹)"
                id="perKmPrice"
                type="number"
                placeholder="e.g. 10"
                value={perKmPrice}
                onChange={(e) => setPerKmPrice(e.target.value)}
                required
              />

              <div className="sm:col-span-4 text-right pt-2">
                <Button
                  type="submit"
                  isLoading={isUpdatingVehicle}
                  variant="primary"
                  size="sm"
                  className="px-6 py-2.5"
                >
                  Save Vehicle Parameters
                </Button>
              </div>
            </form>
          </div>

          {/* Configured Vehicle Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wider">
              Active Vehicle Pricing Parameters
            </h4>

            <Table
              headers={[
                "Vehicle Mode Type",
                "Base Distance (KM)",
                "Base Price Payout",
                "Extra KM Rate",
              ]}
              data={chargesData?.vehicle_charges || []}
              isLoading={isLoading}
              emptyMessage="No vehicle charges parameterized."
              renderRow={(item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-5 py-4 text-xs font-bold text-slate-800">
                    {item.vehicle_type}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600 font-semibold">
                    {item.base_distance} KM
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-slate-700">
                    ₹ {item.base_price.toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-brand-purple">
                    ₹ {item.per_km_price.toFixed(2)} / KM
                  </td>
                </tr>
              )}
            />
          </div>
        </div>

        {/* Right 1 Column: Commissions Configs Forms */}
        <div className="lg:col-span-1 space-y-6">
          {/* DP Commission Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">
              Delivery Partner Rate
            </h3>
            <p className="text-xs text-slate-400">
              Update the standard commission payout allocated per kilometer to
              pilot drivers.
            </p>

            <form onSubmit={handleSaveDpCommission} className="space-y-4 pt-2">
              <Input
                label="Set Delivery Partner Commission (%)"
                id="dpComm"
                type="number"
                step="0.1"
                placeholder="e.g. 35"
                value={dpComm}
                onChange={(e) => setDpComm(e.target.value)}
                required
              />

              <Button
                type="submit"
                isLoading={isUpdatingDp}
                variant="primary"
                size="sm"
                className="w-full"
              >
                Save Partner Rates
              </Button>
            </form>
          </div>

          {/* PDC Commission Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">
              PDC Package Commission
            </h3>
            <p className="text-xs text-slate-400">
              Update the packaging collection incentive paid to the PDC centers
              per order.
            </p>

            <form onSubmit={handleSavePdcCommission} className="space-y-4 pt-2">
              <Input
                label="Set PDC Commission (%)"
                id="pdcComm"
                type="number"
                step="0.1"
                placeholder="e.g. 15"
                value={pdcComm}
                onChange={(e) => setPdcComm(e.target.value)}
                required
              />

              <Button
                type="submit"
                isLoading={isUpdatingPdc}
                variant="primary"
                size="sm"
                className="w-full"
              >
                Save Package Rates
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charges;
