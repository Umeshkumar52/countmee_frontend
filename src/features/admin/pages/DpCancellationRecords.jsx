import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  fetchDpCancellations,
  fetchCancellationSetting,
  updateCancellationSetting,
  unblockDp,
} from "../../../api/admin.api";
import { ShieldAlert, Unlock, Save } from "lucide-react";
import Badge from "../../../components/common/Badge";

const DpCancellationRecords = () => {
  const [records, setRecords] = useState([]);
  const [limit, setLimit] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [month, year]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [limitRes, recordsRes] = await Promise.all([
        fetchCancellationSetting(),
        fetchDpCancellations({ month, year }),
      ]);
      setLimit(limitRes.data.data.limit);
      setRecords(recordsRes.data.data.records || []);
    } catch (err) {
      toast.error("Failed to load cancellation records.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLimit = async () => {
    setIsSaving(true);
    try {
      await updateCancellationSetting({ limit });
      toast.success("Cancellation limit updated successfully");
    } catch (err) {
      toast.error("Failed to update limit");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnblock = async (dpId) => {
    if (!window.confirm("Are you sure you want to unblock this Delivery Partner? This will reset their cancellations for this month.")) {
      return;
    }
    try {
      await unblockDp(dpId);
      toast.success("DP successfully unblocked");
      loadData();
    } catch (err) {
      toast.error("Failed to unblock DP");
    }
  };

  return (
    <div className="space-y-6 page-transition">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="text-red-500 w-6 h-6" />
            DP Cancellation Records
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track and manage delivery partners who frequently cancel orders.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-400 px-1">Max Monthly Cancellations</label>
            <input 
              type="number"
              min="0"
              value={limit}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setLimit(isNaN(val) ? 0 : val);
              }}
              className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all"
            />
          </div>
          <button
            onClick={handleUpdateLimit}
            disabled={isSaving}
            className="h-10 mt-4 px-4 bg-brand-purple text-white rounded-lg text-sm font-semibold hover:bg-brand-purple/90 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800">Monthly Records</h3>
          <div className="flex gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            >
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-slate-500">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-10">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No cancellation records found for this month.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                  <th className="pb-3 px-4">Partner Details</th>
                  <th className="pb-3 px-4 text-center">Cancellations</th>
                  <th className="pb-3 px-4 text-center">Status</th>
                  <th className="pb-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.map((record) => {
                  const isBlocked = record.status === "Blocked";
                  return (
                    <tr key={record._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-800">{record.name || "Unknown"}</p>
                        <p className="text-xs text-slate-500">{record.phone}</p>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${record.totalCancellations >= limit ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                          {record.totalCancellations}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge variant={isBlocked ? "danger" : "success"}>
                          {isBlocked ? "Blocked" : "Active"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {isBlocked && (
                          <button
                            onClick={() => handleUnblock(record._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            Unblock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DpCancellationRecords;
