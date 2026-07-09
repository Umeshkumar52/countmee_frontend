import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchPdcs as apiFetchPdcs,
  activatePdc,
  deactivatePdc,
} from "../../../api/admin.api";
import Table from "../../../components/common/Table";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import { Eye, Search, Plus } from "lucide-react";
import AddPdcModal from "../components/AddPdcModal";
import Pagination from "../../../components/common/Pagination";

export const PdcList = () => {
  const [pdcs, setPdcs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPdcs, setTotalPdcs] = useState(0);

  const navigate = useNavigate();

  const fetchPdcs = async (params = {}) => {
    setIsLoading(true);
    try {
      const mergedParams = { page: currentPage, limit: 10, ...params };
      const response = await apiFetchPdcs(mergedParams);
      const dataPayload = response.data.data || response.data;
      const rawList = dataPayload.pdcs || [];
      const formatted = rawList.map((p) => ({
        id: p.userDetails?._id || p._id,
        userDetails: p.userDetails,
        city: p.city,
        online: p.online,
        status: p.status,
        aadhar_status: p.aadhar_status,
        pan_status: p.pancard_status || p.pan_status,
        gst_status: p.gst_status,
        bank_status: p.bank_status,
      }));
      setPdcs(formatted);
      setCurrentPage(dataPayload.page || 1);
      setTotalPages(dataPayload.totalPages || 1);
      setTotalPdcs(dataPayload.total || 0);
    } catch (e) {
      console.error("Failed to load PDCs", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPdcs({ search: searchQuery, page: 1 });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    if (!searchQuery) {
      fetchPdcs({ page: currentPage });
    }
  }, [currentPage]);

  const handleActivate = async (id) => {
    try {
      await activatePdc(id);
      fetchPdcs();
    } catch (e) {
      console.error("Failed to activate PDC", e);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await deactivatePdc(id);
      fetchPdcs();
    } catch (e) {
      console.error("Failed to deactivate PDC", e);
    }
  };

  const getKycBadge = (pdc) => {
    const isApproved =
      (pdc.aadhar_status === "approved" || pdc.aadhar_status === "Accept") &&
      (pdc.pan_status === "approved" || pdc.pan_status === "Accept") &&
      (pdc.gst_status === "approved" || pdc.gst_status === "Accept") &&
      (pdc.bank_status === "approved" || pdc.bank_status === "Accept");

    if (isApproved) return <Badge variant="success">Verified</Badge>;

    const isRejected =
      pdc.aadhar_status === "rejected" ||
      pdc.aadhar_status === "Reject" ||
      pdc.pan_status === "rejected" ||
      pdc.pan_status === "Reject" ||
      pdc.gst_status === "rejected" ||
      pdc.gst_status === "Reject" ||
      pdc.bank_status === "rejected" ||
      pdc.bank_status === "Reject";

    if (isRejected) return <Badge variant="danger">Rejected</Badge>;

    return <Badge variant="warning">Pending Review</Badge>;
  };

  const headers = [
    "Store Name",
    "Phone",
    "Email",
    "City",
    "KYC Status",
    "Store status",
    "Actions",
  ];

  return (
    <div className="space-y-6 text-left page-transition">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">PDC Store Hubs</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage parcel distribution centers, verify documents, and activate
            outlets
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant="primary"
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Add PDC
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs max-w-md">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search by name, phone, email or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple"
          />
        </div>
      </div>

      <Table
        headers={headers}
        data={pdcs}
        isLoading={isLoading}
        emptyMessage="No PDC hubs registered yet."
        renderRow={(pdc) => (
          <tr key={pdc.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-5 py-4 text-xs font-bold text-slate-800">
              {pdc.userDetails?.name || "N/A"}
            </td>
            <td className="px-5 py-4 text-xs text-slate-500">
              {pdc.userDetails?.phone || "N/A"}
            </td>
            <td className="px-5 py-4 text-xs text-slate-500">
              {pdc.userDetails?.email || "N/A"}
            </td>
            <td className="px-5 py-4 text-xs text-slate-600">
              {pdc.city || "N/A"}
            </td>
            <td className="px-5 py-4 text-xs">{getKycBadge(pdc)}</td>
            <td className="px-5 py-4 text-xs">
              <Badge variant={pdc.online === 1 ? "success" : "slate"}>
                {pdc.online === 1 ? "Online" : "Offline"}
              </Badge>
            </td>
            <td className="px-5 py-4 flex gap-4 text-xs space-x-2">
              <Button
                onClick={() => navigate(`/admin/pdcs/${pdc.id}`)}
                variant="outline"
                size="sm"
                className="py-1 px-2.5 text-[10px]"
              >
                <Eye size={16} /> View
              </Button>
              {/* <Button
                onClick={() => handleActivate(pdc.id)}
                variant="success"
                size="sm"
                className=" py-1 px-2.5 text-[10px]"
              >
                Activate All
              </Button>
              <Button
                onClick={() => handleDeactivate(pdc.id)}
                variant="danger"
                size="sm"
                className="py-1 px-2.5 text-[10px]"
              >
                Deactivate
              </Button> */}
            </td>
          </tr>
        )}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalPdcs}
        onPageChange={(page) => {
          setCurrentPage(page);
          fetchPdcs({ page, search: searchQuery });
        }}
        isLoading={isLoading}
        itemName="PDCs"
      />

      <AddPdcModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchPdcs({ search: searchQuery })}
      />
    </div>
  );
};

export default PdcList;
