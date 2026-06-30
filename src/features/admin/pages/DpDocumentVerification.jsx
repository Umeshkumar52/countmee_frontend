import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchDpDetails as apiFetchDpDetails,
  updateDpDocumentStatusAPI,
} from "../../../api/admin.api";
import Button from "../../../components/common/Button";
import Badge from "../../../components/common/Badge";
import Input from "../../../components/common/Input";
import Modal from "../../../components/common/Modal";
import { CheckCircle, XCircle, Eye, ChevronLeft, FileText } from "lucide-react";

export const DpDocumentVerification = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dpDetail, setDpDetail] = useState(null);
  const [dpDocument, setDpDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Document rejection reasons states
  const [rejectionReasons, setRejectionReasons] = useState({
    aadhar: "",
    dl: "",
    rc: "",
    bank: "",
    rv: "",
  });
  const [showRejectForm, setShowRejectForm] = useState({
    aadhar: false,
    dl: false,
    rc: false,
    bank: false,
    rv: false,
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

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetchDpDetails(id);
      const detail = response.data.data?.dpDetail || response.data.dpDetail;
      const document = response.data.data?.dpDocument || response.data.dpDocument;
      setDpDetail(detail);
      setDpDocument(document);
    } catch (e) {
      console.error("Failed to load DP details", e);
    } finally {
      setIsLoading(false);
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

      // Reload details
      fetchDetails();
    } catch (e) {
      console.error("Failed to update document status", e);
    }
  };

  const renderDocumentSection = (title, type, docs, statusField, rejectReasonField, docNumberLabel, docNumber) => {
    if (!dpDocument) return null;

    const status = dpDocument[statusField];
    const rejectReason = dpDocument[rejectReasonField];

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
                <span className="font-semibold">{docNumberLabel}:</span> {docNumber}
              </p>
            )}
          </div>
          <div>
            {status === "Accept" ? (
              <Badge variant="success">Approved</Badge>
            ) : status === "Reject" ? (
              <Badge variant="danger">Rejected</Badge>
            ) : (
              <Badge variant="warning">Pending</Badge>
            )}
          </div>
        </div>

        {status === "Reject" && rejectReason && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs">
            <span className="font-bold">Rejection Reason:</span> {rejectReason}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <Button
            onClick={() => handleViewDocument(title, docs.map(d => d.img))}
            variant="outline"
            size="sm"
            icon={Eye}
            disabled={docs.every(d => !d.img)}
            className="text-xs py-1 h-8"
          >
            View Uploads
          </Button>

          <Button
            onClick={() => handleDocumentAction(type, "Accept")}
            variant="success"
            size="sm"
            icon={CheckCircle}
            className="text-xs py-1 h-8 ml-auto"
            disabled={status === "Accept"}
          >
            Approve
          </Button>

          <Button
            onClick={() => setShowRejectForm((prev) => ({ ...prev, [type]: !prev[type] }))}
            variant="danger"
            size="sm"
            icon={XCircle}
            className="text-xs py-1 h-8"
            disabled={status === "Reject"}
          >
            Reject
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
                onClick={() => setShowRejectForm((prev) => ({ ...prev, [type]: false }))}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="py-1 h-8"
                disabled={!rejectionReasons[type]}
                onClick={() => handleDocumentAction(type, "Reject", rejectionReasons[type])}
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
    return <div className="text-center py-12 text-slate-400">Loading DP details...</div>;
  }

  if (!dpDetail) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>Delivery Partner not found.</p>
        <Button onClick={() => navigate("/admin/delivery-partners")} size="sm" className="mt-4">
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
          <Button onClick={() => navigate("/admin/delivery-partners")} variant="outline" size="sm" icon={ChevronLeft}>
            Back
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Verify Delivery Partner: {name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Evaluate submitted documents for KYC compliance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col items-center">
            <div className="w-20 h-20 bg-brand-purple-soft rounded-full flex items-center justify-center text-brand-purple font-extrabold text-2xl mb-4 border border-brand-purple/10 overflow-hidden">
              {dpDetail.profile_img ? (
                <img src={getImageUrl(dpDetail.profile_img)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                name.slice(0, 2).toUpperCase()
              )}
            </div>
            <h3 className="font-bold text-slate-800 text-base">{name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{phone}</p>
            <p className="text-xs text-slate-400 truncate w-full text-center mt-0.5">{email}</p>

            <div className="w-full border-t border-slate-50 mt-5 pt-5 space-y-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>DOB:</span>
                <span className="font-semibold text-slate-700">{dpDetail.dob ? new Date(dpDetail.dob).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Gender:</span>
                <span className="font-semibold text-slate-700">{dpDetail.gender || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Overall Approval:</span>
                <Badge variant={dpDetail.document_approval === "Approved" ? "success" : dpDetail.document_approval === "Rejected" ? "danger" : "warning"}>
                  {dpDetail.document_approval}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wide pl-1">
            Submitted KYC Files
          </h3>

          {dpDocument ? (
            <div className="grid grid-cols-1 gap-4">
              {renderDocumentSection(
                "Aadhar Card",
                "aadhar",
                [{ label: "Front", img: dpDocument.aadhar_imgfront }, { label: "Back", img: dpDocument.aadhar_imgback }],
                "adhar_status",
                "adhar_reject_reason",
                "Aadhar No",
                dpDocument.aadhar_number
              )}

              {renderDocumentSection(
                "Driving License",
                "dl",
                [{ label: "Front", img: dpDocument.dl_imgfront }, { label: "Back", img: dpDocument.dl_imgback }],
                "dl_status",
                "dl_reject_reason",
                "DL No",
                dpDocument.dl_number
              )}

              {renderDocumentSection(
                "Registration Certificate (RC)",
                "rc",
                [{ label: "Front", img: dpDocument.rc_imgfront }, { label: "Back", img: dpDocument.rc_imgback }],
                "rc_status",
                "rc_reject_reason",
                "RC No",
                dpDocument.rc_number
              )}

              {renderDocumentSection(
                "Bank Details",
                "bank",
                [{ label: "Front", img: dpDocument.bank_imagefront }, { label: "Back", img: dpDocument.bank_imageback }],
                "bank_status",
                "bank_reject_reason",
                "Bank/Account",
                `${dpDocument.bank_name || ''} - ${dpDocument.bank_acc_number || ''}`
              )}

              {renderDocumentSection(
                "Residence & Vehicle",
                "rv",
                [{ label: "Residence", img: dpDocument.residence_img }, { label: "Vehicle", img: dpDocument.vehicle_img }],
                "rv_status",
                "rv_reject_reason",
                "Vehicle No",
                dpDocument.vehicle_number
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-xs">
              <p className="text-sm text-slate-400">No documents submitted yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      {viewerModal.isOpen && (
        <Modal
          isOpen={viewerModal.isOpen}
          onClose={() => setViewerModal({ isOpen: false, title: "", images: [] })}
          title={viewerModal.title}
          size="5xl"
        >
          <div className="p-4 space-y-6 bg-slate-50 min-h-[50vh] flex flex-col items-center justify-center">
            {viewerModal.images.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {viewerModal.images.map((imgUrl, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                    <img
                      src={getImageUrl(imgUrl)}
                      alt={`Document view ${idx + 1}`}
                      className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/600x400?text=Image+Not+Found";
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">No images available for this document.</p>
            )}
            <div className="flex justify-end w-full">
              <Button onClick={() => setViewerModal({ isOpen: false, title: "", images: [] })} variant="secondary">
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
