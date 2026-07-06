import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { fetchBundleResponses, assignBundleFinal } from "../../../api/orders.api";
import Table from "../../../components/common/Table";
import Button from "../../../components/common/Button";
import { useSocketInstance } from "../../../socket/socketContext";

const BundleResponsesPage = () => {
  const { bundleId } = useParams();
  const navigate = useNavigate();
  const socket = useSocketInstance();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [metrics, setMetrics] = useState({ notified: 0, accepted: 0, rejected: 0, pending: 0 });
  const [responses, setResponses] = useState([]);
  const [bundleData, setBundleData] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchBundleResponses(bundleId);
      if (data) {
        setMetrics(data.metrics || { notified: 0, accepted: 0, rejected: 0, pending: 0 });
        setResponses(data.responses || []);
        setBundleData(data.bundle || null);
      }
    } catch (e) {
      console.error("Failed to fetch bundle responses", e);
      setError(e.response?.data?.message || "Failed to load responses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [bundleId]);

  // Live Socket connection
  useEffect(() => {
    if (!socket) return;

    const handleDpResponse = (data) => {
      if (data.bundle_id !== bundleId) return;
      loadData();
    };

    socket.on("BUNDLE_DP_RESPONDED", handleDpResponse);
    return () => {
      socket.off("BUNDLE_DP_RESPONDED", handleDpResponse);
    };
  }, [socket, bundleId]);

  const handleAssign = async (dpId) => {
    if (!window.confirm("Are you sure you want to assign this order bundle to this DP?")) return;
    
    setIsAssigning(true);
    setError("");
    try {
      await assignBundleFinal(bundleId, dpId);
      alert("Bundle successfully assigned!");
      navigate("/admin/scheduled-orders/broadcasts");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to assign bundle");
      setIsAssigning(false);
    }
  };

  const headers = ["DP Name", "Mobile", "Response", "Vehicle", "Action"];

  const renderRow = (dp, index) => {
    const isBundleAssigned = bundleData?.status === "assigned";
    const isThisDpAssigned = isBundleAssigned && bundleData?.dp_id === dp.id;

    return (
      <tr
        key={dp.id || index}
        className={`transition-colors border-b border-slate-100 last:border-0 ${isThisDpAssigned ? 'bg-blue-50/50 hover:bg-blue-50/70' : 'hover:bg-slate-50'}`}
      >
        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
          {dp.name}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
          {dp.phone}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          {isThisDpAssigned ? (
            <div className="flex items-center gap-1.5 justify-center text-sm font-bold text-blue-700 bg-blue-100 border-2 border-blue-400 px-3 py-1 rounded-full w-[100px]">
              Assigned
            </div>
          ) : dp.response === "Accepted" ? (
            <div className="flex items-center gap-1.5 justify-center text-sm font-semibold text-emerald-700 bg-white border-2 border-emerald-500 px-3 py-1 rounded-full w-[100px]">
              Accepted
            </div>
          ) : dp.response === "Rejected" ? (
            <div className="flex items-center gap-1.5 justify-center text-sm font-semibold text-rose-700 bg-white border-2 border-rose-400 px-3 py-1 rounded-full w-[100px]">
              Rejected
            </div>
          ) : (
            <div className="flex items-center gap-1.5 justify-center text-sm font-semibold text-orange-600 bg-white border-2 border-orange-400 px-3 py-1 rounded-full w-[100px]">
              Pending
            </div>
          )}
        </td>
       
        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
          {dp.vehicle}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          {isThisDpAssigned ? (
            <Button
              variant="primary"
              size="sm"
              disabled={true}
              className="bg-slate-200 text-slate-500 min-w-[100px] rounded flex items-center justify-center gap-1 cursor-not-allowed"
            >
              Assigned
            </Button>
          ) : isBundleAssigned ? (
            <div className="text-slate-400 font-medium pl-2 italic">Not Selected</div>
          ) : dp.response === "Accepted" ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAssign(dp.id)}
              disabled={isAssigning}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px] shadow-sm rounded flex items-center justify-center gap-1"
            >
              Accept
            </Button>
          ) : dp.response === "Rejected" ? (
            <div className="text-rose-600 font-medium pl-2">Rejected</div>
          ) : (
            <div className="text-orange-500 font-medium pl-2">Pending</div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">DP Responses</h1>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              Bundle ID: {bundleId}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Notified */}
        <div className="flex flex-col items-center justify-center p-3 bg-blue-50/50 border-2 rounded-xl border-blue-400 opacity-90">
          <div className="text-blue-700 font-bold text-sm">Notified</div>
          <div className="text-slate-500 text-[10px] mb-1">Total Broadcasted</div>
          <div className="text-2xl font-black text-slate-900 mb-1">{metrics.notified}</div>
          <div className="text-[9px] text-transparent select-none">spacer</div>
        </div>
        
        {/* Accepted */}
        <div className="flex flex-col items-center justify-center p-3 bg-emerald-50/50 border-2 rounded-xl border-emerald-400 opacity-90">
          <div className="text-emerald-700 font-bold text-sm">Accepted</div>
          <div className="text-slate-500 text-[10px] mb-1">Willing to Deliver</div>
          <div className="text-2xl font-black text-slate-900 mb-1">{metrics.accepted}</div>
          <div className="text-[9px] text-transparent select-none">spacer</div>
        </div>
        
        {/* Rejected */}
        <div className="flex flex-col items-center justify-center p-3 bg-rose-50/50 border-2 rounded-xl border-rose-400 opacity-90">
          <div className="text-rose-700 font-bold text-sm">Rejected</div>
          <div className="text-slate-500 text-[10px] mb-1">Declined Request</div>
          <div className="text-2xl font-black text-slate-900 mb-1">{metrics.rejected}</div>
          <div className="text-[9px] text-transparent select-none">spacer</div>
        </div>
        
        {/* Pending */}
        <div className="flex flex-col items-center justify-center p-3 bg-orange-50/50 border-2 rounded-xl border-orange-400 opacity-90">
          <div className="text-orange-600 font-bold text-sm">Pending</div>
          <div className="text-slate-500 text-[10px] mb-1">No Response Yet</div>
          <div className="text-2xl font-black text-slate-900 mb-1">{metrics.pending}</div>
          <div className="text-[9px] text-transparent select-none">spacer</div>
        </div>
      </div>

      <h2 className="text-lg font-bold text-slate-900 mb-4">DP Responses</h2>

      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden rounded-sm">
        <div className="overflow-x-auto min-h-[400px]">
          <Table 
            headers={headers}
            data={responses}
            isLoading={isLoading}
            emptyMessage="No delivery partners were notified."
            renderRow={renderRow}
            tableClassName="min-w-[800px] border-b border-slate-200"
          />
        </div>
      </div>
    </div>
  );
};

export default BundleResponsesPage;
