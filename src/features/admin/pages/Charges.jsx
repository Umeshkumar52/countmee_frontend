import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCharges } from "../../../api/admin.api";
import { VEHICLE_TYPES } from "../../../constants";
import Button from "../../../components/common/Button";
import Table from "../../../components/common/Table";

export const Charges = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [chargesData, setChargesData] = useState(null);

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
    "Extra / Min (₹)",
    "Grace (Min)",
    "Radius (m)",
    "DP Comm.",
    "PDC Comm.",
    "Capacity",
    "Actions",
  ];

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

  return (
    <div className="space-y-6 text-left page-transition w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Charges Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure partner commissions, package delivery fees, and per-vehicle
            rates dynamically.
          </p>
        </div>
        <Button
          onClick={() => navigate("/admin/charges/edit")}
          variant="primary"
          size="sm"
        >
          Add/Edit Configuration
        </Button>
      </div>

      <div className="w-full">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-4">
            Active Delivery Profiles
          </h3>

          <div className="overflow-x-auto">
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
                    ₹ {(item.extra_min_charge || 0).toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-orange-600 whitespace-nowrap">
                    {item.grace_period || 0} Min
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-orange-600 whitespace-nowrap">
                    {item.pickup_geofence_radius || 0} m
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
                  <td className="px-5 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                    <Button
                      onClick={() => navigate(`/admin/charges/edit?vehicle=${item.vehicle_type}`)}
                      variant="secondary"
                      size="xs"
                    >
                      Edit
                    </Button>
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
