import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { assignBundle, fetchBundleSummary } from "../../../api/admin.api";
import Button from "../../../components/common/Button";
import toast from 'react-hot-toast';

export const RecommendDpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract orderIds from router state
  const orderIds = location.state?.orderIds || [];

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmit, setIsSubmit] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [summary, setSummary] = useState(null);
  const [dps, setDps] = useState([]);

  const [selectedDpIds, setSelectedDpIds] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  useEffect(() => {
    // If accessed directly without selecting orders, redirect back
    if (!orderIds || orderIds.length === 0) {
      navigate("/admin/scheduled-orders", { replace: true });
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setErrorMsg("");
      try {
        const res = await fetchBundleSummary(orderIds);
        const data = res.data?.data || res.data;
        setSummary(data);
        setDps(data.capableDps || []);
      } catch (e) {
        console.error("Failed to load bundle summary", e);
        setErrorMsg(
          e.response?.data?.message || "Failed to load summary data.",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [orderIds, navigate]);

  const handleSendNotification = async () => {
    if (selectedDpIds.length === 0) return;
    setIsSubmit(true);
    setErrorMsg("");
    try {
      await assignBundle(orderIds, selectedDpIds);
      toast.success("Bundle broadcasted to selected delivery partners successfully!");
      // Success, go back to orders
      navigate("/admin/scheduled-orders");
    } catch (err) {
      console.error("Failed to broadcast bundle", err);
      setErrorMsg(err.response?.data?.message || "Failed to broadcast bundle");
    } finally {
      setIsSubmit(false);
    }
  };

  const handleToggleDp = (id) => {
    setSelectedDpIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (filteredList) => {
    if (
      selectedDpIds.length === filteredList.length &&
      filteredList.length > 0
    ) {
      setSelectedDpIds([]);
    } else {
      setSelectedDpIds(filteredList.map((dp) => dp.user_id));
    }
  };

  // Filter DPs
  const filteredDps = dps.filter((dp) => {
    if (onlyAvailable && dp.status !== "Available") return false;
    
    const loc = String(dp.location || "");
    if (locationFilter && !loc.toLowerCase().includes(locationFilter.toLowerCase())) {
      return false;
    }
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const nameStr = String(dp.name || "").toLowerCase();
      const phoneStr = String(dp.phone || "").toLowerCase();
      
      if (!nameStr.includes(search) && !phoneStr.includes(search)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="p-6 h-full flex flex-col max-w-[1400px] mx-auto animate-fade-in w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Recommend Delivery Partner
          </h2>
          <p className="text-slate-500 mt-1">
            Review the capacity summary and select the delivery partners to
            broadcast to.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate("/admin/scheduled-orders")}
        >
          ← Back to Orders
        </Button>
      </div>

      <div className="space-y-6 text-left flex-1 flex flex-col">
        {errorMsg && (
          <div className="text-sm text-red-500 bg-red-50 p-4 rounded-lg font-medium border border-red-200">
            {errorMsg}
          </div>
        )}

        {isLoading ? (
          <div className="text-sm text-slate-500 py-10 text-center animate-pulse">
            Calculating recommendations...
          </div>
        ) : summary ? (
          <>
            {/* Top Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="border-2 border-blue-200 bg-blue-50/30 p-4 rounded-xl flex flex-col shadow-sm">
                <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                  Total Orders
                </span>
                <span className="text-3xl font-black text-slate-800 mt-2">
                  {summary.totalProduct}
                </span>
              </div>
              <div className="border-2 border-orange-200 bg-orange-50/30 p-4 rounded-xl flex flex-col shadow-sm">
                <span className="text-sm font-bold text-orange-700 uppercase tracking-wide">
                  Total Weight
                </span>
                <span className="text-3xl font-black text-slate-800 mt-2">
                  {summary.totalWeight} KG{" "}
                  {summary.totalWeight >= 1000
                    ? `(${(summary.totalWeight / 1000).toFixed(1)} Ton)`
                    : ""}
                </span>
              </div>
              <div className="border-2 border-purple-200 bg-purple-50/30 p-4 rounded-xl flex flex-col shadow-sm">
                <span className="text-sm font-bold text-purple-700 uppercase tracking-wide">
                  Est. Distance
                </span>
                <span className="text-3xl font-black text-slate-800 mt-2">
                  {summary.estDistance} Km
                </span>
              </div>
            </div>

            {/* Recommended Vehicle Box */}
            <div className="border-2 border-green-500 bg-green-50 rounded-2xl p-6 relative overflow-hidden shadow-sm">
              <div className="text-sm font-bold text-green-700 uppercase tracking-widest mb-3">
                Recommended Vehicle
              </div>
              {summary.recommendedVehicle ? (
                <>
                  <div className="text-3xl font-black text-slate-900 flex items-center gap-3">
                    🚚 {summary.recommendedVehicle.vehicle_type}
                  </div>
                  <div className="text-base text-slate-700 mt-2 font-medium">
                    Capacity matches {summary.totalWeight} KG load
                  </div>
                  <div className="text-sm text-slate-500 mt-3 flex flex-wrap items-center gap-2 bg-white/50 p-3 rounded-lg border border-green-200/50">
                    <span className="font-semibold text-slate-700">
                      Calculation:
                    </span>
                    {summary.orderBreakdown.map((ob, idx) => (
                      <span key={idx}>
                        {ob.label} ({ob.weight}KG){" "}
                        {idx < summary.orderBreakdown.length - 1 ? " + " : ""}
                      </span>
                    ))}
                    ={" "}
                    <span className="font-bold text-slate-800 bg-green-100 px-2 py-0.5 rounded">
                      {summary.totalWeight} KG
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-base font-bold text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                  No vehicle capable of handling this load. Please split the
                  orders.
                </div>
              )}
            </div>

            {/* Recommendation Logic Matrix */}
            {/* {summary.vehicleMatrix && summary.vehicleMatrix.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Recommendation Logic</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Total Weight</th>
                        <th className="px-6 py-3 font-semibold">Recommended Vehicle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {summary.vehicleMatrix.map((vt, idx) => {
                        const isMatch = summary.recommendedVehicle?.type === vt.type;
                        return (
                          <tr key={idx} className={isMatch ? "bg-green-50/50" : ""}>
                            <td className="px-6 py-3">
                              {idx === 0 ? `Up to ${vt.max_weight} KG` : 
                               (idx === summary.vehicleMatrix.length - 1 ? `Above ${summary.vehicleMatrix[idx-1].max_weight} KG` : 
                               `${summary.vehicleMatrix[idx-1].max_weight} KG - ${vt.max_weight} KG`)}
                               {isMatch && <span className="ml-3 text-xs font-black text-green-700 uppercase bg-green-200/50 px-2 py-1 rounded">◀ Matched</span>}
                            </td>
                            <td className={`px-6 py-3 font-semibold ${isMatch ? "text-green-800" : "text-slate-700"}`}>
                              {vt.type}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )} */}

            {/* DP Selection Screen */}
            {summary.recommendedVehicle && (
              <div className="mt-8 pt-8 border-t-2 border-slate-100 flex flex-col flex-1">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                  <span className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                    3
                  </span>
                  Delivery Partner Selection
                </h3>

                <div className="bg-slate-900 text-white px-5 py-4 rounded-t-xl font-bold text-base flex justify-between items-center">
                  <span>Select Delivery Partners</span>
                  <span className="bg-white/20 px-3 py-1 rounded text-sm">
                    {summary.recommendedVehicle.vehicle_type}
                  </span>
                </div>

                <div className="border-x border-b border-slate-200 rounded-b-xl p-6 bg-white shadow-sm flex flex-col flex-1">
                  {/* Filters */}
                  <div className="flex items-center gap-4 mb-6">
                    <input
                      type="text"
                      placeholder="🔍 Search DP / Mobile"
                      className="border-2 border-slate-200 rounded-lg px-4 py-2.5 text-sm flex-1 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                      className="border-2 border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-brand-purple transition-all"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                    >
                      <option value="">Filter: Location</option>
                      {[...new Set(dps.map((d) => d.location))]
                        .filter(Boolean)
                        .map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                    </select>
                    <label className="flex items-center gap-2 border-2 border-green-500 rounded-lg px-4 py-2.5 text-sm text-green-700 font-bold cursor-pointer bg-green-50 hover:bg-green-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={onlyAvailable}
                        onChange={(e) => setOnlyAvailable(e.target.checked)}
                        className="text-green-600 rounded w-4 h-4 focus:ring-green-500"
                      />
                      Only Available
                    </label>
                    <button
                      onClick={() => handleSelectAll(filteredDps)}
                      className="border-2 border-blue-500 text-blue-700 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors bg-white shadow-sm"
                    >
                      {selectedDpIds.length === filteredDps.length &&
                      filteredDps.length > 0
                        ? "Deselect All"
                        : "☑ Select All"}
                    </button>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-xs uppercase font-bold tracking-wider">
                        <tr>
                          <th className="px-4 py-4 w-12 text-center border-r border-slate-200">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 w-4 h-4"
                              checked={
                                selectedDpIds.length === filteredDps.length &&
                                filteredDps.length > 0
                              }
                              onChange={() => handleSelectAll(filteredDps)}
                            />
                          </th>
                          <th className="px-4 py-4">DP Name</th>
                          <th className="px-4 py-4">Mobile</th>
                          <th className="px-4 py-4">Vehicle No.</th>
                          <th className="px-4 py-4">Type</th>
                          <th className="px-4 py-4">Capacity</th>
                          <th className="px-4 py-4">Current Loc</th>
                          <th className="px-4 py-4">Avail.</th>
                          <th className="px-4 py-4">Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredDps.length === 0 ? (
                          <tr>
                            <td
                              colSpan={9}
                              className="px-6 py-12 text-center text-slate-500 font-medium bg-slate-50/50"
                            >
                              No delivery partners match your filters.
                            </td>
                          </tr>
                        ) : (
                          filteredDps.map((dp) => (
                            <tr
                              key={dp.user_id}
                              className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedDpIds.includes(dp.user_id) ? "bg-blue-50/30" : ""}`}
                              onClick={() => handleToggleDp(dp.user_id)}
                            >
                              <td
                                className="px-4 py-4 text-center border-r border-slate-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  className="rounded text-brand-purple border-slate-300 focus:ring-brand-purple w-4 h-4"
                                  checked={selectedDpIds.includes(dp.user_id)}
                                  onChange={() => handleToggleDp(dp.user_id)}
                                />
                              </td>
                              <td className="px-4 py-4 font-bold text-slate-800">
                                {dp.name}
                              </td>
                              <td className="px-4 py-4 text-slate-600 font-medium">
                                {dp.phone}
                              </td>
                              <td className="px-4 py-4 text-slate-600">
                                {dp.vehicle_no}
                              </td>
                              <td className="px-4 py-4 text-slate-600">
                                {dp.vehicle_type}
                              </td>
                              <td className="px-4 py-4 text-slate-600 font-semibold">
                                {dp.capacity} KG
                              </td>
                              <td className="px-4 py-4 text-slate-600">
                                {dp.location}
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={`text-xs font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-full w-max ${dp.status === "Available" ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${dp.status === "Available" ? "bg-green-600" : "bg-red-500"}`}
                                  ></span>
                                  {dp.status}
                                </span>
                              </td>
                              <td className="px-4 py-4 font-bold text-slate-700">
                                ★ {dp.rating}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions */}
                  <div className="mt-8 flex justify-between items-center bg-slate-50 p-6 -mx-6 -mb-6 border-t border-slate-200 rounded-b-xl">
                    <div className="text-base text-slate-600">
                      <span className="font-black text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-sm mr-2">
                        {selectedDpIds.length}
                      </span>
                      <span className="font-medium">DPs selected</span>
                    </div>
                    <div className="flex gap-4">
                      <Button
                        variant="secondary"
                        onClick={() => navigate("/admin/scheduled-orders")}
                        disabled={isSubmit}
                        className="px-6 py-2.5 text-base"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleSendNotification}
                        disabled={isSubmit || selectedDpIds.length === 0}
                        className="px-8 py-2.5 text-base font-bold shadow-md hover:shadow-lg"
                      >
                        {isSubmit ? "Sending..." : "Broadcast to DPs"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default RecommendDpPage;
