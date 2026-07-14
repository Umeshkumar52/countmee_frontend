import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  PackageOpen,
  Users,
  Eye,
  Radio,
} from "lucide-react";
import { fetchActiveBundles } from "../../../api/orders.api";
import Table from "../../../components/common/Table";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import BundleDetailsModal from "../../../components/common/BundleDetailsModal";

const BroadcastBundlesPage = () => {
  const navigate = useNavigate();
  const [bundles, setBundles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedViewBundle, setSelectedViewBundle] = useState(null);

  const loadBundles = async () => {
    setIsLoading(true);
    try {
      const data = await fetchActiveBundles();
      setBundles(data?.bundles || []);
    } catch (e) {
      toast.error("Failed to fetch bundles");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBundles();
  }, []);

  const headers = [
    "Bundle ID",
    "Status",
    "Orders Count",
    "Accepted DPs",
    "Rejected DPs",
    "Notified DPs",
    "Actions",
  ];

  const renderRow = (bundle, index) => {
    return (
      <tr
        key={bundle.bundle_id || index}
        className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
      >
        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
          <div className="flex items-center gap-2">
            <PackageOpen className="w-4 h-4 text-brand-purple" />
            {bundle.bundle_id}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          {bundle.status === "broadcasting" ? (
            <Badge
              variant="warning"
              className="flex items-center gap-1 w-fit bg-amber-50 text-amber-700 border border-amber-200"
            >
              <Clock className="w-3 h-3" /> Broadcasting
            </Badge>
          ) : bundle.status === "assigned" ? (
            <Badge
              variant="success"
              className="flex items-center gap-1 w-fit bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              <CheckCircle2 className="w-3 h-3" /> Assigned
            </Badge>
          ) : (
            <Badge
              variant="error"
              className="flex items-center gap-1 w-fit bg-rose-50 text-rose-700 border border-rose-200"
            >
              <XCircle className="w-3 h-3" /> {bundle.status}
            </Badge>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
          {bundle.orders?.length || 0} Orders
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full w-fit">
            <CheckCircle2 className="w-4 h-4" />
            {bundle.accepted_dps?.length || 0}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full w-fit">
            <XCircle className="w-4 h-4" />
            {bundle.rejected_dps?.length || 0}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full w-fit">
            <Users className="w-4 h-4" />
            {bundle.notified_dps?.length || 0}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedViewBundle(bundle)}
              className="p-1.5 hover:bg-slate-100"
              title="View Bundle Details"
            >
              <Eye className="w-4 h-4 text-slate-600" />
            </Button>
            {bundle.status === "assigned" ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  navigate(
                    `/admin/scheduled-orders/broadcasts/${bundle.bundle_id}/track`,
                  )
                }
                className="shadow-sm hover:shadow-md transition-shadow bg-blue-600 hover:bg-blue-700"
              >
                Track Assignment
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  navigate(
                    `/admin/scheduled-orders/broadcasts/${bundle.bundle_id}`,
                  )
                }
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                View Responses
              </Button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* <Button variant="ghost" onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button> */}
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 tracking-tight">
              <Radio className="w-8 h-8 text-brand-purple" />
              Broadcast Orders
            </h1>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              Manage currently active order bundles broadcasted to delivery
              partners.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={loadBundles}
          className="flex items-center gap-2 font-semibold"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoading ? "animate-spin text-brand-purple" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <Table
            headers={headers}
            data={bundles}
            isLoading={isLoading}
            emptyMessage="No active broadcast bundles found."
            renderRow={renderRow}
            tableClassName="min-w-[1000px]"
          />
        </div>
      </div>

      <BundleDetailsModal
        bundle={selectedViewBundle}
        onClose={() => setSelectedViewBundle(null)}
        onViewResponses={(bundleId) =>
          navigate(`/admin/scheduled-orders/broadcasts/${bundleId}`)
        }
      />
    </div>
  );
};

export default BroadcastBundlesPage;
