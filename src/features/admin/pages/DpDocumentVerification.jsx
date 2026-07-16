import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchDpDetails as apiFetchDpDetails,
  updateDpDocumentStatusAPI,
  fetchVehicleSubcategoriesByType,
  updatePartner,
  blockDpAPI
} from "../../../api/admin.api";
import Button from "../../../components/common/Button";
import Badge from "../../../components/common/Badge";
import Input from "../../../components/common/Input";
import Modal from "../../../components/common/Modal";
import {
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  FileText,
  Download,
  Edit2,
  Save,
  X,
  Ban
} from "lucide-react";
import toast from "react-hot-toast";

export const DpDocumentVerification = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dpDetail, setDpDetail] = useState(null);
  const [dpDocument, setDpDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const [isEditingSubType, setIsEditingSubType] = useState(false);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [editedSubType, setEditedSubType] = useState("");
  const [isSavingSubType, setIsSavingSubType] = useState(false);



  const DOCUMENT_TYPES = [
    { type: "aadhar", statusField: "adhar_status" },
    { type: "dl", statusField: "dl_status" },
    { type: "rc", statusField: "rc_status" },
    { type: "bank", statusField: "bank_status" },
    { type: "rv", statusField: "rv_status" },
    { type: "insurance", statusField: "insurance_status" },
    { type: "emission", statusField: "emission_status" },
    { type: "permit", statusField: "permit_status" }
  ];

  const handleBlockToggle = async () => {
    setIsBlocking(true);
    try {
      const newStatus = !isBlocked;
      await blockDpAPI(id, { is_blocked: newStatus });
      setIsBlocked(newStatus);
      toast.success(`Delivery Partner successfully ${newStatus ? 'blocked' : 'unblocked'}`);
    } catch (err) {
      console.error("Failed to toggle block status", err);
      toast.error("Failed to toggle block status");
      toast.error("Failed to update block status");
    } finally {
      setIsBlocking(false);
    }
  };

  const handleEditSubTypeClick = async () => {
    setIsEditingSubType(true);
    setEditedSubType(dpDocument.sub_vehicle_type || "");
    try {
      const res = await fetchVehicleSubcategoriesByType(dpDocument.vehicle_type);
      if (res.data?.data?.subcategories) {
        setAvailableSubcategories(res.data.data.subcategories);
      }
    } catch (err) {
      console.error("Failed to fetch subcategories:", err);
      toast.error("Failed to fetch subcategories:");
      toast.error("Failed to fetch sub vehicle options");
    }
  };

  const handleSaveSubType = async () => {
    setIsSavingSubType(true);
    try {
      const formData = new FormData();
      formData.append("sub_vehicle_type", editedSubType);
      await updatePartner(id, formData);
      toast.success("Sub Vehicle Type updated successfully");
      setDpDocument(prev => ({ ...prev, sub_vehicle_type: editedSubType }));
      setIsEditingSubType(false);
    } catch (err) {
      console.error("Failed to update sub type:", err);
      toast.error("Failed to update sub type:");
      toast.error("Failed to update sub vehicle type");
    } finally {
      setIsSavingSubType(false);
    }
  };

  const [rejectionReasons, setRejectionReasons] = useState({
    aadhar: "",
    dl: "",
    rc: "",
    bank: "",
    rv: "",
    insurance: "",
    emission: "",
    permit: "",
  });
  const [showRejectForm, setShowRejectForm] = useState({
    aadhar: false,
    dl: false,
    rc: false,
    bank: false,
    rv: false,
    insurance: false,
    emission: false,
    permit: false,
  });

  // Modal viewer state
  const [viewerModal, setViewerModal] = useState({
    isOpen: false,
    title: "",
    images: [],
  });

  const getImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    const serverBase = apiBase.replace(/\/api\/?$/, "");
    const cleanPath = path.replace(/^\/?(uploads\/)?/, "");
    return `${serverBase}/uploads/${cleanPath}`;
  };

  const handleViewDocument = (name, images) => {
    setViewerModal({
      isOpen: true,
      title: `View Document: ${name}`,
      images: images.filter(Boolean), // remove empty images
    });
  };

  const handleDownloadDocument = (docs) => {
    docs.forEach((doc) => {
      const path = doc.img || doc.path;
      if (path) {
        const url = getImageUrl(path);
        fetch(url)
          .then((response) => response.blob())
          .then((blob) => {
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = blobUrl;
            const filename =
              path.split("/").pop() || `document-${doc.label}.jpg`;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
          })
          .catch((err) => {
            console.error("Download failed", err);
            toast.error("Download failed");
          });
      }
    });
  };

  const handleDownloadAll = () => {
    if (!dpDocument) return;
    const allDocs = [
      { label: "Aadhar Front", img: dpDocument.aadhar_imgfront },
      { label: "Aadhar Back", img: dpDocument.aadhar_imgback },
      { label: "DL Front", img: dpDocument.dl_imgfront },
      { label: "DL Back", img: dpDocument.dl_imgback },
      { label: "RC Front", img: dpDocument.rc_imgfront },
      { label: "RC Back", img: dpDocument.rc_imgback },
      { label: "Bank Front", img: dpDocument.bank_imagefront },
      { label: "Bank Back", img: dpDocument.bank_imageback },
      { label: "Residence", img: dpDocument.residence_img },
      { label: "Vehicle", img: dpDocument.vehicle_img },
      { label: "Insurance", img: dpDocument.insurance_document },
      { label: "Emission", img: dpDocument.emission_certificate_document },
      { label: "Travel Permit", img: dpDocument.permit_document },
    ].filter((doc) => doc.img);
    handleDownloadDocument(allDocs);
  };

  const fetchDetails = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await apiFetchDpDetails(id);
      const detail = response.data.data?.dpDetail || response.data.dpDetail;
      const document =
        response.data.data?.dpDocument || response.data.dpDocument;
      setDpDetail(detail);
      setDpDocument(document);
      setIsBlocked(detail.user?.is_blocked || detail.user_id?.is_blocked || false);
    } catch (e) {
      console.error("Failed to load DP details", e);
      toast.error("Failed to load DP details");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleDocumentAction = async (docType, status, reason = "") => {
    try {
      await updateDpDocumentStatusAPI({
        document_id: dpDocument._id, // Must pass DpDocument ID
        document_type: docType,
        status,
        reason,
      });

      // Reset reason and toggles
      setRejectionReasons((prev) => ({ ...prev, [docType]: "" }));
      setShowRejectForm((prev) => ({ ...prev, [docType]: false }));

      // Reload details without showing full-page loader
      fetchDetails(false);
    } catch (e) {
      console.error("Failed to update document status", e);
      toast.error("Failed to update document status");
    }
  };


  const renderDocumentSection = (
    title,
    type,
    docs,
    statusField,
    rejectReasonField,
    docNumberLabel,
    docNumber,
  ) => {
    if (!dpDocument) return null;

    const status = dpDocument[statusField]?.toLowerCase();
    const rejectReason = dpDocument[rejectReasonField];

    const isApproved = status === "approved";
    const isRejected = status === "rejected";

    return (
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-purple" />
              {title}
            </h3>
            {docNumber && (
              <p className="text-xs text-slate-500 mt-1">
                <span className="font-semibold">{docNumberLabel}:</span>{" "}
                {docNumber}
              </p>
            )}
          </div>
          <div>{/* Badge removed as button text now reflects status */}</div>
        </div>

        {status === "rejected" && rejectReason && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs">
            <span className="font-bold">Rejection Reason:</span> {rejectReason}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <Button
            onClick={() =>
              handleViewDocument(
                title,
                docs.map((d) => d.img),
              )
            }
            variant="outline"
            size="sm"
            icon={Eye}
            disabled={docs.every((d) => !d.img)}
            className="text-xs py-1 h-8"
          >
            View Uploads
          </Button>

          <Button
            onClick={() => handleDownloadDocument(docs)}
            variant="outline"
            size="sm"
            icon={Download}
            disabled={docs.every((d) => !d.img)}
            className="text-xs py-1 h-8"
          >
            Download
          </Button>

          <Button
            onClick={() => handleDocumentAction(type, "approved")}
            variant="success"
            size="sm"
            icon={CheckCircle}
            className="text-xs py-1 h-8 ml-auto"
            disabled={isApproved}
          >
            {isApproved ? "Approved" : "Approve"}
          </Button>

          <Button
            onClick={() =>
              setShowRejectForm((prev) => ({ ...prev, [type]: !prev[type] }))
            }
            variant="danger"
            size="sm"
            icon={XCircle}
            className="text-xs py-1 h-8"
            disabled={isRejected}
          >
            {isRejected ? "Rejected" : "Reject"}
          </Button>
        </div>

        {showRejectForm[type] && (
          <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-200">
            <Input
              label="Reason for Rejection"
              placeholder="e.g. Image is blurry, name mismatch..."
              value={rejectionReasons[type]}
              onChange={(e) =>
                setRejectionReasons((prev) => ({
                  ...prev,
                  [type]: e.target.value,
                }))
              }
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="py-1 h-8"
                onClick={() =>
                  setShowRejectForm((prev) => ({ ...prev, [type]: false }))
                }
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="py-1 h-8"
                disabled={!rejectionReasons[type]}
                onClick={() =>
                  handleDocumentAction(type, "rejected", rejectionReasons[type])
                }
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-slate-400">
        Loading DP details...
      </div>
    );
  }

  if (!dpDetail) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>Delivery Partner not found.</p>
        <Button
          onClick={() => navigate("/admin/delivery-partners")}
          size="sm"
          className="mt-4"
        >
          Back to List
        </Button>
      </div>
    );
  }

  const user = dpDetail.user || dpDetail.user_id || {};
  const name = user.name || "N/A";
  const phone = user.phone || "N/A";
  const email = user.email || "N/A";

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left page-transition">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate("/admin/delivery-partners")}
            variant="outline"
            size="sm"
            icon={ChevronLeft}
          >
            Back
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Verify Delivery Partner: {name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluate submitted documents for KYC compliance
            </p>
          </div>
        </div>
        
        {/* Block / Unblock Button */}
        <Button
          onClick={handleBlockToggle}
          variant={isBlocked ? "success" : "danger"}
          size="sm"
          icon={Ban}
          disabled={isBlocking}
          className="ml-auto"
        >
          {isBlocking ? "Processing..." : isBlocked ? "Unblock DP" : "Block DP"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col items-center">
            <div className="w-20 h-20 bg-brand-purple-soft rounded-full flex items-center justify-center text-brand-purple font-extrabold text-2xl mb-4 border border-brand-purple/10 overflow-hidden">
              {dpDetail.profile_img ? (
                <img
                  src={getImageUrl(dpDetail.profile_img)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                name.slice(0, 2).toUpperCase()
              )}
            </div>
            <h3 className="font-bold text-slate-800 text-base">{name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{phone}</p>
            <p className="text-xs text-slate-400 truncate w-full text-center mt-0.5">
              {email}
            </p>

            <div className="w-full border-t border-slate-50 mt-5 pt-5 space-y-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>DOB:</span>
                <span className="font-semibold text-slate-700">
                  {dpDetail?.user_id?.dob
                    ? new Date(dpDetail?.user_id?.dob).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Gender:</span>
                <span className="font-semibold text-slate-700">
                  {dpDetail.gender || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Overall Approval:</span>
                <Badge
                  variant={
                    dpDetail.document_approval === "approved"
                      ? "success"
                      : dpDetail.document_approval === "rejected"
                        ? "danger"
                        : "warning"
                  }
                >
                  {dpDetail.document_approval}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pl-1 gap-4">
            <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wide">
              Submitted KYC Files
            </h3>
            {dpDocument && (
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleDownloadAll}
                  variant="outline"
                  size="sm"
                  icon={Download}
                  className="text-xs h-8"
                >
                  Download All
                </Button>
              </div>
            )}
          </div>

          {dpDocument ? (
            <div className="grid grid-cols-1 gap-4">
              {renderDocumentSection(
                "Aadhar Card",
                "aadhar",
                [
                  { label: "Front", img: dpDocument.aadhar_imgfront },
                  { label: "Back", img: dpDocument.aadhar_imgback },
                ],
                "adhar_status",
                "adhar_reject_reason",
                "Aadhar No",
                dpDocument.aadhar_number,
              )}

              {renderDocumentSection(
                "Driving License",
                "dl",
                [
                  { label: "Front", img: dpDocument.dl_imgfront },
                  { label: "Back", img: dpDocument.dl_imgback },
                ],
                "dl_status",
                "dl_reject_reason",
                "DL No",
                dpDocument.dl_number,
              )}

              {renderDocumentSection(
                "Registration Certificate (RC)",
                "rc",
                [
                  { label: "Front", img: dpDocument.rc_imgfront },
                  { label: "Back", img: dpDocument.rc_imgback },
                ],
                "rc_status",
                "rc_reject_reason",
                "RC No",
                dpDocument.rc_number,
              )}

              {renderDocumentSection(
                "Bank Details",
                "bank",
                [
                  { label: "Front", img: dpDocument.bank_imagefront },
                  { label: "Back", img: dpDocument.bank_imageback },
                ],
                "bank_status",
                "bank_reject_reason",
                "Bank/Account",
                `${dpDocument.bank_name || ""} - ${dpDocument.bank_acc_number || ""}`,
              )}

              {renderDocumentSection(
                "Residence & Vehicle Images",
                "rv",
                [
                  { label: "Residence", img: dpDocument.residence_img },
                  { label: "Vehicle", img: dpDocument.vehicle_img },
                ],
                "rv_status",
                "rv_reject_reason",
                "Vehicle No",
                dpDocument.vehicle_number,
              )}

              {/* Extra Vehicle Details (Read-only view) */}
              <div className="p-4 border rounded-lg bg-gray-50 flex flex-col gap-2 shadow-sm relative">
                <h3 className="font-semibold text-lg text-gray-800 mb-2 border-b pb-2">Vehicle Specifications</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4 text-sm text-gray-700">
                  <p><strong>Type:</strong> {dpDocument.vehicle_type || "N/A"}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <strong>Sub Type:</strong> 
                    {isEditingSubType ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editedSubType}
                          onChange={(e) => setEditedSubType(e.target.value)}
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#553092]"
                        >
                          <option value="">Select</option>
                          {availableSubcategories.map(sub => (
                            <option key={sub._id} value={sub.sub_vehicle_type}>{sub.sub_vehicle_type}</option>
                          ))}
                        </select>
                        <button onClick={handleSaveSubType} disabled={isSavingSubType} className="text-green-600 hover:text-green-700 disabled:opacity-50">
                          <Save size={16} />
                        </button>
                        <button onClick={() => setIsEditingSubType(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="flex items-center gap-2">
                        {dpDocument.sub_vehicle_type || "N/A"}
                        {dpDocument.vehicle_type && (
                          <button onClick={handleEditSubTypeClick} className="text-blue-500 hover:text-blue-700 tooltip" title="Edit Sub Type">
                            <Edit2 size={14} />
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                  <p><strong>Capacity:</strong> {dpDocument.vehicle_min_capacity ? `${dpDocument.vehicle_min_capacity} - ${dpDocument.vehicle_max_capacity} kg` : "N/A"}</p>
                  <p><strong>Is New Vehicle:</strong> {dpDocument.is_new_vehicle ? "Yes" : "No"}</p>
                  <p><strong>Registration Date:</strong> {dpDocument.vehicle_registration_date || "N/A"}</p>
                  <p><strong>Travel States:</strong> {dpDocument.travel_permit_states?.length > 0 ? dpDocument.travel_permit_states.join(", ") : "N/A"}</p>
                </div>
              </div>


              {renderDocumentSection(
                "Insurance Document",
                "insurance",
                [{ label: "Insurance", img: dpDocument.insurance_document }],
                "insurance_status",
                "insurance_reject_reason",
                "Expiry Date",
                dpDocument.insurance_expiry_date,
              )}

              {renderDocumentSection(
                "Emission Certificate",
                "emission",
                [{ label: "Emission", img: dpDocument.emission_certificate_document }],
                "emission_status",
                "emission_reject_reason",
                "Expiry Date",
                dpDocument.emission_expiry_date,
              )}

              {renderDocumentSection(
                "Travel Permit",
                "permit",
                [{ label: "Travel Permit", img: dpDocument.permit_document }],
                "permit_status",
                "permit_reject_reason",
                "Expiry Date",
                dpDocument.permit_expiry,
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-xs">
              <p className="text-sm text-slate-400">
                No documents submitted yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      {viewerModal.isOpen && (
        <Modal
          isOpen={viewerModal.isOpen}
          onClose={() =>
            setViewerModal({ isOpen: false, title: "", images: [] })
          }
          title={viewerModal.title}
          size="5xl"
        >
          <div className="p-4 space-y-6 bg-slate-50 min-h-[50vh] flex flex-col items-center justify-center">
            {viewerModal.images.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {viewerModal.images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-2 rounded-xl shadow-sm border border-slate-200"
                  >
                    <img
                      src={getImageUrl(imgUrl)}
                      alt={`Document view ${idx + 1}`}
                      className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://via.placeholder.com/600x400?text=Image+Not+Found";
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">
                No images available for this document.
              </p>
            )}
            <div className="flex justify-end w-full">
              <Button
                onClick={() =>
                  setViewerModal({ isOpen: false, title: "", images: [] })
                }
                variant="secondary"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}


    </div>
  );
};

export default DpDocumentVerification;
