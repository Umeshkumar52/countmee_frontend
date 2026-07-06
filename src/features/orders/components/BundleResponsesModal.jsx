import React, { useEffect, useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Clock,
} from "lucide-react";
import {
  fetchBundleResponses,
  assignBundleFinal,
} from "../../../api/orders.api";
import Button from "../../../components/common/Button";
import Badge from "../../../components/common/Badge";

const BundleResponsesModal = ({ bundleId, onClose, onAssigned }) => {
  const [bundle, setBundle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState("");

  const loadResponses = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchBundleResponses(bundleId);
      setBundle(data.bundle);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load bundle responses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResponses();
  }, [bundleId]);

  const handleAssign = async (dpId) => {
    if (
      !window.confirm(
        "Are you sure you want to assign this bundle to this Delivery Partner?",
      )
    )
      return;

    setIsAssigning(true);
    setError("");
    try {
      await assignBundleFinal(bundleId, dpId);
      alert("Bundle successfully assigned!");
      if (onAssigned) onAssigned();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to assign bundle");
      setIsAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Bundle Responses
            </h2>
            <p className="text-sm text-slate-500 mt-1">ID: {bundleId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">{error}</div>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-4 text-brand-purple" />
              <p>Loading responses...</p>
            </div>
          ) : !bundle ? (
            <div className="text-center py-12 text-slate-500">
              Bundle not found.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Accepted DPs */}
              <div className="bg-white border border-emerald-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-800">
                    Approved ({bundle.accepted_dps?.length || 0})
                  </h3>
                </div>
                <div className="divide-y divide-emerald-50">
                  {bundle.accepted_dps?.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500 text-center">
                      No delivery partners have approved this bundle yet.
                    </p>
                  ) : (
                    bundle.accepted_dps.map((dp) => (
                      <div
                        key={dp._id}
                        className="p-4 flex items-center justify-between hover:bg-slate-50"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {dp.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {dp.phone} &bull; {dp.email}
                          </p>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAssign(dp._id)}
                          disabled={
                            isAssigning || bundle.status !== "broadcasting"
                          }
                          className="flex items-center gap-2"
                        >
                          <UserCheck className="w-4 h-4" />
                          Assign
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Rejected DPs */}
              <div className="bg-white border border-rose-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-rose-50 px-4 py-3 border-b border-rose-100 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <h3 className="font-semibold text-rose-800">
                    Rejected ({bundle.rejected_dps?.length || 0})
                  </h3>
                </div>
                <div className="divide-y divide-rose-50">
                  {bundle.rejected_dps?.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500 text-center">
                      No delivery partners have rejected this bundle yet.
                    </p>
                  ) : (
                    bundle.rejected_dps.map((dp) => (
                      <div key={dp._id} className="p-4 hover:bg-slate-50">
                        <p className="font-medium text-slate-900">{dp.name}</p>
                        <p className="text-sm text-slate-500">
                          {dp.phone} &bull; {dp.email}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Notified but Pending DPs */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-500" />
                  <h3 className="font-semibold text-slate-700">
                    Pending Response (
                    {(bundle.notified_dps?.length || 0) -
                      (bundle.accepted_dps?.length || 0) -
                      (bundle.rejected_dps?.length || 0)}
                    )
                  </h3>
                </div>
                <div className="p-4 text-sm text-slate-500 text-center">
                  Waiting for response from other notified delivery partners.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BundleResponsesModal;
