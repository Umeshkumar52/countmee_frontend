import toast from 'react-hot-toast';
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchPdcDetails as apiFetchPdcDetails,
  updateDocumentStatus,
  updatePdcLocation,
} from "../../../api/admin.api";
import Button from "../../../components/common/Button";
import Badge from "../../../components/common/Badge";
import Input from "../../../components/common/Input";
import Modal from "../../../components/common/Modal";
import {
  Eye,
  Download,
  ChevronLeft,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";

export const PdcDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pdc, setPdc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Operational details update states
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  // Document rejection reasons states
  const [rejectionReasons, setRejectionReasons] = useState({
    aadhar: "",
    pan: "",
    gst: "",
    bank: "",
  });
  const [showRejectForm, setShowRejectForm] = useState({
    aadhar: false,
    pan: false,
    gst: false,
    bank: false,
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
      images: images,
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
          .catch((err) => console.error("Download failed", err));
      }
    });
  };

  const handleDownloadAll = () => {
    if (!pdc) return;
    const allDocs = [
      { label: "Aadhar Front", path: pdc.aadhar_front_image },
      { label: "Aadhar Back", path: pdc.aadhar_back_image },
      { label: "PAN Card", path: pdc.pancard_image },
      { label: "GST Doc", path: pdc.gst_doc },
      { label: "Passbook", path: pdc.passbook_image }
    ].filter(doc => doc.path);
    handleDownloadDocument(allDocs);
  };

  const fetchPdcDetails = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetchPdcDetails(id);
      const pdcData = response.data.pdc || response.data.data?.pdc;
      if (pdcData) {
        pdcData.pan_status = pdcData.pancard_status || pdcData.pan_status;
      }
      setPdc(pdcData);
      setLatitude(pdcData?.latitude || "");
      setLongitude(pdcData?.longitude || "");
    } catch (e) {
      console.error("Failed to load PDC details", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPdcDetails();
  }, [id]);

  const handleDocumentAction = async (docType, status, reason = "") => {
    try {
      await updateDocumentStatus({
        pdcId: id,
        type: docType,
        status,
        reason,
      });

      // Reset reason and toggles
      setRejectionReasons((prev) => ({ ...prev, [docType]: "" }));
      setShowRejectForm((prev) => ({ ...prev, [docType]: false }));

      // Reload details
      fetchPdcDetails();
    } catch (e) {
      console.error("Failed to update document status", e);
    }
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    setIsUpdatingLocation(true);
    try {
      await updatePdcLocation(id, { latitude, longitude });
      toast.success("Operational location updated successfully!");
      fetchPdcDetails();
    } catch (e) {
      console.error("Failed to update location", e);
    } finally {
      setIsUpdatingLocation(false);
    }
  };
  console.log("PDC Data:", pdc);
  const renderDocumentSection = (
    title,
    docKey,
    docs,
    statusField,
    rejectReasonField,
    docNumberLabel,
    docNumber,
  ) => {
    if (!pdc) return null;

    const status = pdc[statusField];
    const rejectReason = pdc[rejectReasonField];

    // Status normalization for badge
    const isApproved = status === "approved" || status === "Accept";
    const isRejected = status === "rejected" || status === "Reject";

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
          <div>
            {/* Badge removed as button text now reflects status */}
          </div>
        </div>

        {isRejected && rejectReason && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs">
            <span className="font-bold">Rejection Reason:</span> {rejectReason}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <Button
            onClick={() =>
              handleViewDocument(
                title,
                docs.filter((d) => d.path).map((d) => ({ ...d, img: d.path })),
              )
            }
            variant="outline"
            size="sm"
            icon={Eye}
            disabled={docs.every((d) => !d.path)}
            className="text-xs py-1 h-8"
          >
            View Uploads
          </Button>

          <Button
            onClick={() => handleDownloadDocument(docs)}
            variant="outline"
            size="sm"
            icon={Download}
            disabled={docs.every((d) => !d.path)}
            className="text-xs py-1 h-8"
          >
            Download
          </Button>

          <Button
            onClick={() => handleDocumentAction(docKey, "approved")}
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
              setShowRejectForm((prev) => ({
                ...prev,
                [docKey]: !prev[docKey],
              }))
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

        {showRejectForm[docKey] && (
          <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-200">
            <Input
              label="Reason for Rejection"
              placeholder="e.g. Image is blurry, name mismatch..."
              value={rejectionReasons[docKey]}
              onChange={(e) =>
                setRejectionReasons((prev) => ({
                  ...prev,
                  [docKey]: e.target.value,
                }))
              }
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="py-1 h-8"
                onClick={() =>
                  setShowRejectForm((prev) => ({ ...prev, [docKey]: false }))
                }
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="py-1 h-8"
                disabled={!rejectionReasons[docKey]}
                onClick={() =>
                  handleDocumentAction(
                    docKey,
                    "rejected",
                    rejectionReasons[docKey],
                  )
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
        Loading PDC profile details...
      </div>
    );
  }

  if (!pdc) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>PDC Hub not found.</p>
        <Button
          onClick={() => navigate("/admin/pdc-list")}
          size="sm"
          className="mt-4"
        >
          Back to List
        </Button>
      </div>
    );
  }

  const documentItems = [
    {
      key: "aadhar",
      name: "Aadhar Card Proof",
      status: pdc.aadhar_status,
      reason: pdc.aadhar_reject_reason,
      images: [
        { label: "Front Image", path: pdc.aadhar_front_image },
        { label: "Back Image", path: pdc.aadhar_back_image },
      ].filter((img) => img.path),
    },
    {
      key: "pan",
      name: "PAN Card Details",
      status: pdc.pan_status,
      reason: pdc.pan_reject_reason,
      images: [{ label: "PAN Card Image", path: pdc.pancard_image }].filter(
        (img) => img.path,
      ),
    },
    {
      key: "gst",
      name: "GST Certification",
      status: pdc.gst_status,
      reason: pdc.gst_reject_reason,
      images: [{ label: "GST Document", path: pdc.gst_doc }].filter(
        (img) => img.path,
      ),
    },
    {
      key: "bank",
      name: "Bank Details (Cheque/Passbook)",
      status: pdc.bank_status,
      reason: pdc.bank_reject_reason,
      images: [
        { label: "Passbook/Cheque Image", path: pdc.passbook_image },
      ].filter((img) => img.path),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left page-transition">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate("/admin/pdc-list")}
            variant="outline"
            size="sm"
            icon={ChevronLeft}
          >
            Back
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              PDC Review: {pdc.userDetails?.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluate onboarding credentials and coordinate locations
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Profile Card & Location Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col items-center">
            <div className="w-20 h-20 bg-brand-purple-soft rounded-full flex items-center justify-center text-brand-purple font-extrabold text-2xl mb-4 border border-brand-purple/10 overflow-hidden">
              {pdc.profile_image || pdc.userDetails?.profile_img ? (
                <img
                  src={getImageUrl(
                    pdc.profile_image || pdc.userDetails?.profile_img,
                  )}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : pdc.userDetails?.name ? (
                pdc.userDetails.name.slice(0, 2).toUpperCase()
              ) : (
                "PD"
              )}
            </div>
            <h3 className="font-bold text-slate-800 text-base">
              {pdc.userDetails?.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {pdc.userDetails?.phone}
            </p>

            <div className="w-full border-t border-slate-50 mt-5 pt-5 space-y-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                  {pdc.userDetails?.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Lat/Long:</span>
                <span className="font-semibold text-slate-700">
                  {pdc.latitude || "0.0"}, {pdc.longitude || "0.0"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Store Hub:</span>
                <span className="font-semibold text-slate-700">
                  {pdc.city || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Location Update form */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4">
              Update Hub Location
            </h3>
            <form onSubmit={handleUpdateLocation} className="space-y-4">
              <Input
                label="Latitude"
                id="latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
              />
              <Input
                label="Longitude"
                id="longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
              />
              <Button
                type="submit"
                isLoading={isUpdatingLocation}
                variant="primary"
                size="sm"
                className="w-full"
              >
                Save Hub Location
              </Button>
            </form>
          </div>
        </div>

        {/* Right Side: Document evaluation */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pl-1">
            <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wide">
              Store KYC Files
            </h3>
            {pdc && (
              <Button onClick={handleDownloadAll} variant="outline" size="sm" icon={Download} className="text-xs h-8">
                Download All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {renderDocumentSection(
              "Aadhar Card Proof",
              "aadhar",
              [
                { label: "Front Image", path: pdc.aadhar_front_image },
                { label: "Back Image", path: pdc.aadhar_back_image },
              ],
              "aadhar_status",
              "aadhar_reject_reason",
            )}

            {renderDocumentSection(
              "PAN Card Details",
              "pan",
              [{ label: "PAN Card Image", path: pdc.pancard_image }],
              "pan_status",
              "pan_reject_reason",
            )}

            {renderDocumentSection(
              "GST Certification",
              "gst",
              [{ label: "GST Document", path: pdc.gst_doc }],
              "gst_status",
              "gst_reject_reason",
            )}

            {renderDocumentSection(
              "Bank Details (Cheque/Passbook)",
              "bank",
              [{ label: "Passbook/Cheque Image", path: pdc.passbook_image }],
              "bank_status",
              "bank_reject_reason",
            )}
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <Modal
        isOpen={viewerModal.isOpen}
        onClose={() => setViewerModal((prev) => ({ ...prev, isOpen: false }))}
        title={viewerModal.title}
        size="lg"
      >
        <div className="space-y-6">
          {viewerModal.images.map((img, idx) => (
            <div key={idx} className="space-y-2">
              {viewerModal.images.length > 1 && (
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  {img.label}
                </span>
              )}
              <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-2 max-h-[50vh]">
                <img
                  src={getImageUrl(img.path)}
                  alt={img.label}
                  className="max-w-full max-h-[48vh] object-contain rounded-lg shadow-sm"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://placehold.co/600x400?text=Failed+to+load+image";
                  }}
                />
              </div>
              <div className="text-center">
                <a
                  href={getImageUrl(img.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-purple hover:underline font-semibold"
                >
                  🔗 Open in New Tab
                </a>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default PdcDetails;
