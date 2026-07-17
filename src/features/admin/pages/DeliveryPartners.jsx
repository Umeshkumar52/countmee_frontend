import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchPartners as apiFetchPartners,
  createPartner,
  updatePartner,
  deletePartner,
  fetchDpDetails,
  updateDpApprovalStatus,
  updateDpDocumentStatusAPI,
  fetchVehicleSubcategoriesByType,
} from "../../../api/admin.api";
import Table from "../../../components/common/Table";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import Input from "../../../components/common/Input";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import BulkUploadDpModal from "../components/BulkUploadDpModal";
import Pagination from "../../../components/common/Pagination";
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  FolderUp,
  Truck,
} from "lucide-react";
import { VEHICLE_TYPES } from "../../../constants";
import toast from "react-hot-toast";

// Reusable File Upload Preview Component
const FileUpload = ({ label, id, preview, onChange, required }) => (
  <div className="flex flex-col text-left space-y-1">
    <span className="text-xs font-semibold text-slate-600">
      {label} {required && <span className="text-red-500 ml-0.5">*</span>}
    </span>
    <div className="relative border border-dashed border-slate-200 hover:border-[#553092] rounded-xl p-3 flex flex-col items-center justify-center bg-slate-50 transition-colors h-28 cursor-pointer overflow-hidden">
      {preview ? (
        <img
          src={preview}
          alt="Upload Preview"
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center text-slate-400">
          <FolderUp size={24} className="mb-1 text-slate-400" />
          <span className="text-[10px] font-semibold mt-1">Upload image</span>
        </div>
      )}
      <input
        type="file"
        id={id}
        accept="image/*"
        onChange={onChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </div>
  </div>
);

const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  
  // Clean up any extra spaces
  const str = dateString.toString().trim();
  
  // 1. If it's already YYYY-MM-DD (optionally with time), return YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // 2. Handle formats like DD-MM-YYYY or DD/MM/YYYY
  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 2 && parts[2].length === 4) {
      // Convert DD-MM-YYYY to YYYY-MM-DD
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  // 3. Fallback to native Date parsing for other known formats
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  return "";
};

export const DeliveryPartners = () => {
  const getImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    const serverBase = apiBase.replace(/\/api\/?$/, "");
    const cleanPath = path.replace(/^\/?(uploads\/)?/, "");
    return `${serverBase}/uploads/${cleanPath}`;
  };

  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Bulk reject states
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [bulkRejectDpId, setBulkRejectDpId] = useState(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const DOCUMENT_TYPES = [
    { type: "aadhar", statusField: "adhar_status" },
    { type: "dl", statusField: "dl_status" },
    { type: "rc", statusField: "rc_status" },
    { type: "bank", statusField: "bank_status" },
    { type: "rv", statusField: "rv_status" },
    { type: "insurance", statusField: "insurance_status" },
    { type: "emission", statusField: "emission_status" },
    { type: "permit", statusField: "permit_status" },
  ];

  // Add/Edit Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null); // null for add, partner object for edit
  const [isSubmit, setIsSubmit] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic"); // used for edit mode tabs

  // Form fields states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [vehicle, setVehicle] = useState(VEHICLE_TYPES.TWO_WHEELER); // maps to vehicle_type

  // Documents
  const [aadharNumber, setAadharNumber] = useState("");
  const [aadharImgFront, setAadharImgFront] = useState(null);
  const [aadharImgBack, setAadharImgBack] = useState(null);
  const [rcNumber, setRcNumber] = useState("");
  const [rcImgFront, setRcImgFront] = useState(null);
  const [rcImgBack, setRcImgBack] = useState(null);
  const [dlNumber, setDlNumber] = useState("");
  const [dlImgFront, setDlImgFront] = useState(null);
  const [dlImgBack, setDlImgBack] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [residenceImg, setResidenceImg] = useState(null);
  const [vehicleImg, setVehicleImg] = useState(null);

  // Bank details
  const [bankName, setBankName] = useState("");
  const [bankAccNumber, setBankAccNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankImageFront, setBankImageFront] = useState(null);
  const [bankImgBack, setBankImgBack] = useState(null);

  // References
  const [reference1Name, setReference1Name] = useState("");
  const [reference1Phone, setReference1Phone] = useState("");

  // Files state (raw file uploads and preview URLs)
  const [profileImg, setProfileImg] = useState(null);
  const [profileImgPreview, setProfileImgPreview] = useState("");
  const [aadharImgFrontPreview, setAadharImgFrontPreview] = useState("");
  const [aadharImgBackPreview, setAadharImgBackPreview] = useState("");
  const [rcImgFrontPreview, setRcImgFrontPreview] = useState("");
  const [rcImgBackPreview, setRcImgBackPreview] = useState("");
  const [dlImgFrontPreview, setDlImgFrontPreview] = useState("");
  const [dlImgBackPreview, setDlImgBackPreview] = useState("");
  const [residenceImgPreview, setResidenceImgPreview] = useState("");
  const [vehicleImgPreview, setVehicleImgPreview] = useState("");
  const [bankImageFrontPreview, setBankImageFrontPreview] = useState("");
  const [bankImgBackPreview, setBankImgBackPreview] = useState("");

  const [dlExpiryDate, setDlExpiryDate] = useState("");
  const [reference2Name, setReference2Name] = useState("");
  const [reference2Phone, setReference2Phone] = useState("");

  const [subVehicleType, setSubVehicleType] = useState("");
  const [availableSubcategories, setAvailableSubcategories] = useState([]);

  useEffect(() => {
    if (vehicle) {
      fetchVehicleSubcategoriesByType(vehicle)
        .then((res) => {
          if (res.data?.data?.subcategories) {
            setAvailableSubcategories(res.data.data.subcategories);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch subcategories:", err);
          toast.error("Failed to fetch subcategories:");
          setAvailableSubcategories([]);
        });
    } else {
      setAvailableSubcategories([]);
    }
  }, [vehicle]);

  const [otherVehicleDetails, setOtherVehicleDetails] = useState("");
  const [vehicleMinCapacity, setVehicleMinCapacity] = useState("");
  const [vehicleMaxCapacity, setVehicleMaxCapacity] = useState("");
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState("");
  const [emissionExpiryDate, setEmissionExpiryDate] = useState("");
  const [isNewVehicle, setIsNewVehicle] = useState(false);
  const [vehicleRegistrationDate, setVehicleRegistrationDate] = useState("");
  const [travelPermitStates, setTravelPermitStates] = useState("");
  const [permitExpiry, setPermitExpiry] = useState("");

  const [insuranceDocument, setInsuranceDocument] = useState(null);
  const [emissionCertificateDocument, setEmissionCertificateDocument] =
    useState(null);
  const [permitDocument, setPermitDocument] = useState(null);

  const [insuranceDocumentPreview, setInsuranceDocumentPreview] = useState("");
  const [
    emissionCertificateDocumentPreview,
    setEmissionCertificateDocumentPreview,
  ] = useState("");
  const [permitDocumentPreview, setPermitDocumentPreview] = useState("");
  // Step state (1: Basic, 2: Vehicle, 3: KYC Docs & Bank, 4: References)
  const [currentStep, setCurrentStep] = useState(1);
  const [validationError, setValidationError] = useState("");

  // Delete Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPartners = async (params = {}) => {
    setIsLoading(true);
    try {
      const pageToFetch = params.page || currentPage;
      const response = await apiFetchPartners({ ...params, page: pageToFetch });
      const dataObj = response.data.data || response.data;
      const rawList = dataObj.dpList || [];
      
      if (dataObj.page) setCurrentPage(dataObj.page);
      if (dataObj.totalPages) setTotalPages(dataObj.totalPages);

      let formatted = rawList.map((d) => ({
        id: d._id,
        name: d.user?.name || "N/A",
        phone: d.user?.phone || "N/A",
        email: d.user?.email || "N/A",
        vehicle: d.vehicle_type || VEHICLE_TYPES.TWO_WHEELER,
        status: d.status,
        document_approval: d.document_approval,
      }));

      if (params.search) {
        const query = params.search.toLowerCase();
        formatted = formatted.filter(
          (dp) =>
            dp.name.toLowerCase().includes(query) ||
            dp.phone.toLowerCase().includes(query) ||
            dp.email.toLowerCase().includes(query) ||
            dp.vehicle.toLowerCase().includes(query),
        );
      }

      setPartners(formatted);
    } catch (e) {
      console.error("Failed to fetch partners", e);
      toast.error("Failed to fetch partners");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1);
      fetchPartners({ search: searchQuery, page: 1 });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchPartners({ search: searchQuery, page });
  };

  const handleOpenAddModal = () => {
    setSelectedPartner(null);
    setCurrentStep(1);
    setValidationError("");

    // Clear all inputs
    setName("");
    setEmail("");
    setPhone("");
    setDob("");
    setGender("");
    setAddress("");
    setVehicle(VEHICLE_TYPES.TWO_WHEELER);

    setAadharNumber("");
    setRcNumber("");
    setDlNumber("");
    setVehicleNumber("");
    setBankName("");
    setBankAccNumber("");
    setBankIfsc("");
    setReference1Name("");
    setReference1Phone("");
    setDlExpiryDate("");
    setReference2Name("");
    setReference2Phone("");
    setSubVehicleType("");
    setOtherVehicleDetails("");
    setVehicleMinCapacity("");
    setVehicleMaxCapacity("");
    setInsuranceExpiryDate("");
    setEmissionExpiryDate("");
    setIsNewVehicle(false);
    setVehicleRegistrationDate("");
    setTravelPermitStates("");

    // Clear file states
    setProfileImg(null);
    setAadharImgFront(null);
    setAadharImgBack(null);
    setRcImgFront(null);
    setRcImgBack(null);
    setDlImgFront(null);
    setDlImgBack(null);
    setResidenceImg(null);
    setVehicleImg(null);
    setBankImageFront(null);
    setBankImgBack(null);
    setInsuranceDocument(null);
    setEmissionCertificateDocument(null);
    setPermitDocument(null);

    // Clear previews
    setProfileImgPreview("");
    setAadharImgFrontPreview("");
    setAadharImgBackPreview("");
    setRcImgFrontPreview("");
    setRcImgBackPreview("");
    setDlImgFrontPreview("");
    setDlImgBackPreview("");
    setResidenceImgPreview("");
    setVehicleImgPreview("");
    setBankImageFrontPreview("");
    setBankImgBackPreview("");
    setInsuranceDocumentPreview("");
    setEmissionCertificateDocumentPreview("");
    setPermitDocumentPreview("");

    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (partner) => {
    setSelectedPartner(partner);
    setIsModalOpen(true);
    setIsDetailLoading(true);
    setActiveTab("basic");
    setValidationError("");

    // Clear inputs first
    setName(partner.name || "");
    setEmail(partner.email || "");
    setPhone(partner.phone || "");
    // Ensure vehicle is always a valid type known by the backend
    const validVehicleTypes = Object.values(VEHICLE_TYPES);
    const safeVehicle = validVehicleTypes.includes(partner.vehicle)
      ? partner.vehicle
      : VEHICLE_TYPES.TWO_WHEELER;
    setVehicle(safeVehicle);
    setDob("");
    setGender("");
    setAddress("");
    setAadharNumber("");
    setRcNumber("");
    setDlNumber("");
    setVehicleNumber("");
    setBankName("");
    setBankAccNumber("");
    setBankIfsc("");
    setReference1Name("");
    setReference1Phone("");
    setDlExpiryDate("");
    setReference2Name("");
    setReference2Phone("");
    setSubVehicleType("");
    setOtherVehicleDetails("");
    setVehicleMinCapacity("");
    setVehicleMaxCapacity("");
    setInsuranceExpiryDate("");
    setEmissionExpiryDate("");
    setIsNewVehicle(false);
    setVehicleRegistrationDate("");
    setTravelPermitStates("");

    // Clear previews/files
    setProfileImg(null);
    setAadharImgFront(null);
    setAadharImgBack(null);
    setRcImgFront(null);
    setRcImgBack(null);
    setDlImgFront(null);
    setDlImgBack(null);
    setResidenceImg(null);
    setVehicleImg(null);
    setBankImageFront(null);
    setBankImgBack(null);
    setInsuranceDocument(null);
    setEmissionCertificateDocument(null);
    setPermitDocument(null);

    setProfileImgPreview("");
    setAadharImgFrontPreview("");
    setAadharImgBackPreview("");
    setRcImgFrontPreview("");
    setRcImgBackPreview("");
    setDlImgFrontPreview("");
    setDlImgBackPreview("");
    setResidenceImgPreview("");
    setVehicleImgPreview("");
    setBankImageFrontPreview("");
    setBankImgBackPreview("");
    setInsuranceDocumentPreview("");
    setEmissionCertificateDocumentPreview("");
    setPermitDocumentPreview("");

    try {
      const response = await fetchDpDetails(partner.id);
      const { dpDetail, dpDocument } =
        response.data.data || response.data || {};

      setName(dpDetail?.user_id?.name || partner.name || "");
      setEmail(dpDetail?.user_id?.email || partner.email || "");
      setPhone(dpDetail?.user_id?.phone || partner.phone || "");
      setDob(
        dpDetail?.user_id?.dob
          ? dpDetail.user_id.dob.split("T")[0]
          : dpDetail?.dob
            ? dpDetail.dob.split("T")[0]
            : "",
      );
      setGender(dpDetail?.gender ? dpDetail.gender.toLowerCase() : "");
      setAddress(dpDetail?.address || "");
      // Ensure the loaded vehicle_type is a valid type accepted by the backend
      const rawVehicleType =
        dpDocument?.vehicle_type ||
        partner.vehicle ||
        VEHICLE_TYPES.TWO_WHEELER;
      setVehicle(
        validVehicleTypes.includes(rawVehicleType)
          ? rawVehicleType
          : VEHICLE_TYPES.TWO_WHEELER,
      );

      setAadharNumber(dpDocument?.aadhar_number || "");
      setRcNumber(dpDocument?.rc_number || "");
      setDlNumber(dpDocument?.dl_number || "");
      setVehicleNumber(dpDocument?.vehicle_number || "");
      setBankName(dpDocument?.bank_name || "");
      setBankAccNumber(dpDocument?.bank_acc_number || "");
      setBankIfsc(dpDocument?.bank_ifsc || "");
      setReference1Name(dpDocument?.reference1_name || "");
      setReference1Phone(dpDocument?.reference1_phone || "");
      setDlExpiryDate(formatDateForInput(dpDocument?.dl_expiry_date));
      setReference2Name(dpDocument?.reference2_name || "");
      setReference2Phone(dpDocument?.reference2_phone || "");
      setSubVehicleType(dpDocument?.sub_vehicle_type || "");
      setOtherVehicleDetails(dpDocument?.other_vehicle_details || "");
      setVehicleMinCapacity(dpDocument?.vehicle_min_capacity || "");
      setVehicleMaxCapacity(dpDocument?.vehicle_max_capacity || "");
      setInsuranceExpiryDate(formatDateForInput(dpDocument?.insurance_expiry_date));
      setEmissionExpiryDate(formatDateForInput(dpDocument?.emission_expiry_date));
      setPermitExpiry(formatDateForInput(dpDocument?.permit_expiry));
      setIsNewVehicle(dpDocument?.is_new_vehicle || false);
      setVehicleRegistrationDate(formatDateForInput(dpDocument?.vehicle_registration_date));
      setTravelPermitStates(dpDocument?.travel_permit_states?.join(", ") || "");

      // Set image previews
      if (dpDetail?.profile_img)
        setProfileImgPreview(getImageUrl(dpDetail.profile_img));
      if (dpDocument?.aadhar_imgfront)
        setAadharImgFrontPreview(getImageUrl(dpDocument.aadhar_imgfront));
      if (dpDocument?.aadhar_imgback)
        setAadharImgBackPreview(getImageUrl(dpDocument.aadhar_imgback));
      if (dpDocument?.rc_imgfront)
        setRcImgFrontPreview(getImageUrl(dpDocument.rc_imgfront));
      if (dpDocument?.rc_imgback)
        setRcImgBackPreview(getImageUrl(dpDocument.rc_imgback));
      if (dpDocument?.dl_imgfront)
        setDlImgFrontPreview(getImageUrl(dpDocument.dl_imgfront));
      if (dpDocument?.dl_imgback)
        setDlImgBackPreview(getImageUrl(dpDocument.dl_imgback));
      if (dpDocument?.residence_img)
        setResidenceImgPreview(getImageUrl(dpDocument.residence_img));
      if (dpDocument?.vehicle_img)
        setVehicleImgPreview(getImageUrl(dpDocument.vehicle_img));
      if (dpDocument?.bank_imagefront)
        setBankImageFrontPreview(getImageUrl(dpDocument.bank_imagefront));
      if (dpDocument?.bank_imageback)
        setBankImgBackPreview(getImageUrl(dpDocument.bank_imageback));
      if (dpDocument?.insurance_document)
        setInsuranceDocumentPreview(getImageUrl(dpDocument.insurance_document));
      if (dpDocument?.emission_certificate_document)
        setEmissionCertificateDocumentPreview(
          getImageUrl(dpDocument.emission_certificate_document),
        );
      if (dpDocument?.permit_document)
        setPermitDocumentPreview(getImageUrl(dpDocument.permit_document));
    } catch (err) {
      console.error("Failed to fetch DP details", err);
      toast.error("Failed to fetch DP details");
      setValidationError("Failed to load details. Using list summary.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Revoke object URLs
    [
      profileImgPreview,
      aadharImgFrontPreview,
      aadharImgBackPreview,
      rcImgFrontPreview,
      rcImgBackPreview,
      dlImgFrontPreview,
      dlImgBackPreview,
      residenceImgPreview,
      vehicleImgPreview,
      bankImageFrontPreview,
      bankImgBackPreview,
      insuranceDocumentPreview,
      emissionCertificateDocumentPreview,
      permitDocumentPreview,
    ].forEach((p) => {
      if (p && p.startsWith("blob:")) {
        URL.revokeObjectURL(p);
      }
    });
  };

  const handleFileChange = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      // Basic type & size checks
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload an image file (JPEG, PNG, GIF, WebP)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should not exceed 5MB");
        return;
      }

      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const validateStep = (step) => {
    setValidationError("");
    if (step === 1) {
      if (!selectedPartner && !profileImg) {
        setValidationError("Profile upload is required");
        return false;
      }
      if (!name.trim()) {
        setValidationError("Name is required");
        return false;
      }
      if (!phone.trim() || phone.length !== 10 || !/^\d+$/.test(phone)) {
        setValidationError("A valid 10-digit Phone Number is required");
        return false;
      }
      if (
        !email.trim() ||
        !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
      ) {
        setValidationError("A valid Email Address is required");
        return false;
      }
      if (!gender) {
        setValidationError("Gender is required");
        return false;
      }
      if (!dob) {
        setValidationError("Date of Birth is required");
        return false;
      } else {
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          setValidationError("Delivery Partner must be at least 18 years old");
          return false;
        }
      }
      if (!address.trim()) {
        setValidationError("Address is required");
        return false;
      }
    }
    if (step === 2) {
      if (!vehicle) {
        setValidationError("Vehicle Type is required");
        return false;
      }
    }
    if (step === 3) {
      if (
        !aadharNumber.trim() ||
        aadharNumber.length !== 12 ||
        !/^\d+$/.test(aadharNumber)
      ) {
        setValidationError("A valid 12-digit Aadhar Number is required");
        return false;
      }
      if (!selectedPartner && (!aadharImgFront || !aadharImgBack)) {
        setValidationError("Aadhar Front and Back images are required");
        return false;
      }
      if (!rcNumber.trim()) {
        setValidationError("RC Number is required");
        return false;
      }
      if (!selectedPartner && (!rcImgFront || !rcImgBack)) {
        setValidationError("RC Front and Back images are required");
        return false;
      }
      if (!dlNumber.trim()) {
        setValidationError("DL Number is required");
        return false;
      }
      if (!selectedPartner && (!dlImgFront || !dlImgBack)) {
        setValidationError("DL Front and Back images are required");
        return false;
      }
      if (!vehicleNumber.trim()) {
        setValidationError("Vehicle Number is required");
        return false;
      }
      if (!selectedPartner && (!residenceImg || !vehicleImg)) {
        setValidationError("Residence and Vehicle images are required");
        return false;
      }
      if (!bankName.trim()) {
        setValidationError("Bank Name is required");
        return false;
      }
      if (!bankAccNumber.trim() || !/^\d{6,18}$/.test(bankAccNumber)) {
        setValidationError(
          "A valid Bank Account Number is required (6-18 digits)",
        );
        return false;
      }
      if (!bankIfsc.trim() || !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(bankIfsc)) {
        setValidationError(
          "A valid Bank IFSC Code is required (e.g. SBIN0001234)",
        );
        return false;
      }
      if (!selectedPartner && (!bankImageFront || !bankImgBack)) {
        setValidationError("Bank Front and Back images are required");
        return false;
      }
    }

    if (step === 4) {
      if (
        reference1Phone.trim() &&
        (reference1Phone.length !== 10 || !/^\d+$/.test(reference1Phone))
      ) {
        setValidationError(
          "If provided, 1st Reference Contact must be a valid 10-digit number",
        );
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPartner) {
      if (!validateStep(4)) return;
    } else {
      if (
        !validateStep(1) ||
        !validateStep(2) ||
        !validateStep(3) ||
        !validateStep(4)
      )
        return;
    }

    setIsSubmit(true);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("phone", phone.trim());
      formData.append("email", email.trim());
      formData.append("dob", dob);
      formData.append("gender", gender);
      formData.append("address", address.trim());
      formData.append("vehicle_type", vehicle);
      formData.append("aadhar_number", aadharNumber.trim());
      formData.append("rc_number", rcNumber.trim());
      formData.append("dl_number", dlNumber.trim());
      formData.append("bank_name", bankName.trim());
      formData.append("bank_acc_number", bankAccNumber.trim());
      formData.append("bank_ifsc", bankIfsc.trim().toUpperCase());
      formData.append("vehicle_number", vehicleNumber.trim());
      formData.append("reference1_name", reference1Name.trim());
      formData.append("reference1_phone", reference1Phone.trim());

      if (dlExpiryDate) formData.append("dl_expiry_date", dlExpiryDate);
      if (reference2Name)
        formData.append("reference2_name", reference2Name.trim());
      if (reference2Phone)
        formData.append("reference2_phone", reference2Phone.trim());
      if (subVehicleType)
        formData.append("sub_vehicle_type", subVehicleType.trim());
      if (otherVehicleDetails)
        formData.append("other_vehicle_details", otherVehicleDetails.trim());
      if (vehicleMinCapacity)
        formData.append("vehicle_min_capacity", vehicleMinCapacity);
      if (vehicleMaxCapacity)
        formData.append("vehicle_max_capacity", vehicleMaxCapacity);
      if (insuranceExpiryDate)
        formData.append("insurance_expiry_date", insuranceExpiryDate);
      if (emissionExpiryDate)
        formData.append("emission_expiry_date", emissionExpiryDate);
      if (permitExpiry) formData.append("permit_expiry", permitExpiry);
      formData.append("is_new_vehicle", isNewVehicle);
      if (vehicleRegistrationDate)
        formData.append("vehicle_registration_date", vehicleRegistrationDate);
      if (travelPermitStates)
        formData.append("travel_permit_states", travelPermitStates.trim());

      // Append files
      if (profileImg) formData.append("profile_img", profileImg);
      if (aadharImgFront) formData.append("aadhar_imgfront", aadharImgFront);
      if (aadharImgBack) formData.append("aadhar_imgback", aadharImgBack);
      if (rcImgFront) formData.append("rc_imgfront", rcImgFront);
      if (rcImgBack) formData.append("rc_imgback", rcImgBack);
      if (dlImgFront) formData.append("dl_imgfront", dlImgFront);
      if (dlImgBack) formData.append("dl_imgback", dlImgBack);
      if (residenceImg) formData.append("residence_img", residenceImg);
      if (vehicleImg) formData.append("vehicle_img", vehicleImg);
      if (bankImageFront) formData.append("bank_imagefront", bankImageFront);
      if (bankImgBack) formData.append("bank_imageback", bankImgBack);
      if (insuranceDocument)
        formData.append("insurance_document", insuranceDocument);
      if (emissionCertificateDocument)
        formData.append(
          "emission_certificate_document",
          emissionCertificateDocument,
        );
      if (permitDocument) formData.append("permit_document", permitDocument);

      if (selectedPartner) {
        await updatePartner(selectedPartner.id, formData);
      } else {
        await createPartner(formData);
      }
      setIsModalOpen(false);
      fetchPartners();
    } catch (err) {
      console.error("Submit failed", err);
      toast.error("Submit failed");
      setValidationError(
        err.response?.data?.message ||
          "An error occurred during submission. Please check your inputs.",
      );
    } finally {
      setIsSubmit(false);
    }
  };

  const handleTriggerDelete = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleteLoading(true);
    try {
      await deletePartner(deleteId);
      fetchPartners();
    } catch (e) {
      console.error("Delete failed", e);
      toast.error("Delete failed");
    } finally {
      setIsDeleteLoading(false);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const handleToggleApproval = async (id, currentApproval) => {
    if (currentApproval === "approved") {
      // Switching to reject
      setBulkRejectDpId(id);
      setShowBulkRejectModal(true);
      return;
    }

    // Approving
    const newStatus = "approved";
    setIsLoading(true);
    try {
      const response = await fetchDpDetails(id);
      const dpDocument =
        response.data.data?.dpDocument || response.data.dpDocument;

      if (dpDocument) {
        const pendingDocs = DOCUMENT_TYPES.filter((doc) => {
          const status = dpDocument[doc.statusField]?.toLowerCase();
          return status !== "approved" && status !== "rejected";
        });

        for (const doc of pendingDocs) {
          await updateDpDocumentStatusAPI({
            document_id: dpDocument._id,
            document_type: doc.type,
            status: "approved",
            reason: "",
          });
        }
      }

      await updateDpApprovalStatus({
        userId: id,
        document_approval: newStatus,
      });

      // fetchPartners sets isLoading to false eventually when it loads
      await fetchPartners();
      toast.success("Delivery Partner and documents approved.");
    } catch (e) {
      console.error("Failed to approve partner", e);
      toast.error("Failed to approve partner");
      setIsLoading(false);
    }
  };

  const handleConfirmBulkReject = async () => {
    if (!bulkRejectDpId || !bulkRejectReason.trim()) return;
    setIsBulkProcessing(true);
    try {
      const response = await fetchDpDetails(bulkRejectDpId);
      const dpDocument =
        response.data.data?.dpDocument || response.data.dpDocument;

      if (dpDocument) {
        const pendingDocs = DOCUMENT_TYPES.filter((doc) => {
          const status = dpDocument[doc.statusField]?.toLowerCase();
          return status !== "approved" && status !== "rejected";
        });

        for (const doc of pendingDocs) {
          await updateDpDocumentStatusAPI({
            document_id: dpDocument._id,
            document_type: doc.type,
            status: "rejected",
            reason: bulkRejectReason,
          });
        }
      }

      await updateDpApprovalStatus({
        userId: bulkRejectDpId,
        document_approval: "rejected",
      });
      await fetchPartners();
      toast.success("Delivery Partner and documents rejected.");
      setShowBulkRejectModal(false);
      setBulkRejectReason("");
      setBulkRejectDpId(null);
    } catch (e) {
      console.error("Failed to reject partner", e);
      toast.error("Failed to reject partner");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const headers = [
    "Name",
    "Phone",
    "Email",
    "Vehicle",
    "Verification",
    "Status",
    "Actions",
  ];

  return (
    <div className="space-y-6 text-left page-transition">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <Truck className="w-7 h-7 text-brand-purple" />
            Delivery Partners
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage delivery boys and verify operational documents
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setIsBulkModalOpen(true)}
            icon={FolderUp}
            variant="outline"
            size="sm"
          >
            Bulk Upload DPs
          </Button>
          <Button
            onClick={handleOpenAddModal}
            icon={Plus}
            variant="primary"
            size="sm"
          >
            Add Delivery Partner
          </Button>
        </div>
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
            placeholder="Search by name, phone or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple"
          />
        </div>
      </div>

      <Table
        headers={headers}
        data={partners}
        isLoading={isLoading}
        emptyMessage="No delivery boys registered yet."
        renderRow={(dp) => (
          <tr key={dp.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-5 py-4 text-xs font-bold text-slate-800 whitespace-nowrap">
              {dp.name}
            </td>
            <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
              {dp.phone}
            </td>
            <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
              {dp.email}
            </td>
            <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
              {dp.vehicle || "Bike"}
            </td>
            <td className="px-5 py-4 text-xs whitespace-nowrap">
              <Button
                onClick={() =>
                  handleToggleApproval(dp.id, dp.document_approval)
                }
                variant={
                  dp.document_approval === "approved" ? "danger" : "success"
                }
                size="sm"
                className="py-1 px-2.5 text-[10px]"
              >
                {dp.document_approval === "approved" ? "Reject" : "Approve"}
              </Button>
            </td>
            <td className="px-5 py-4 text-xs whitespace-nowrap">
              <Badge
                variant={
                  dp.document_approval === "approved" ? "success" : "warning"
                }
              >
                {dp.document_approval === "approved" ? "Verified" : "Pending"}
              </Badge>
            </td>
            <td className="px-5 py-4 text-xs flex items-center space-x-2 whitespace-nowrap">
              <Button
                onClick={() => navigate(`/admin/delivery-partners/${dp.id}`)}
                variant="outline"
                size="sm"
                className="py-1 px-2.5 text-[10px]"
                icon={Eye}
              >
                View
              </Button>
              <Button
                onClick={() => handleOpenEditModal(dp)}
                variant="secondary"
                size="sm"
                className="py-1 px-2.5 text-[10px]"
                icon={Edit2}
              >
                Edit
              </Button>
              <Button
                onClick={() => handleTriggerDelete(dp.id)}
                variant="danger"
                size="sm"
                className="py-1 px-2.5 text-[10px]"
                icon={Trash2}
              >
                Delete
              </Button>
            </td>
          </tr>
        )}
      />

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          size="3xl"
          title={
            selectedPartner ? "Edit Delivery Partner" : "Add Delivery Partner"
          }
        >
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            {validationError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-4 py-2.5 rounded-xl">
                ⚠️ {validationError}
              </div>
            )}

            {/* Stepper Header for Add Mode */}
            {!selectedPartner && (
              <div className="mb-6">
                <div className="flex items-center justify-between relative">
                  {/* Progress Line */}
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-100 z-0">
                    <div
                      className="h-full bg-[#553092] transition-all duration-300"
                      style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                    ></div>
                  </div>

                  {/* Steps */}
                  {[
                    { step: 1, label: "Basic Details" },
                    { step: 2, label: "Mode of Delivery" },
                    { step: 3, label: "Documents" },
                    { step: 4, label: "References" },
                  ].map((s) => (
                    <div
                      key={s.step}
                      className="flex flex-col items-center z-10 relative"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300 ${
                          currentStep === s.step
                            ? "bg-[#553092] border-[#553092] text-white ring-4 ring-[#553092]/10"
                            : currentStep > s.step
                              ? "bg-[#553092] border-[#553092] text-white"
                              : "bg-white border-slate-200 text-slate-400"
                        }`}
                      >
                        {currentStep > s.step ? "✓" : s.step}
                      </div>
                      <span
                        className={`text-[9px] font-bold mt-1 transition-colors uppercase tracking-wider ${
                          currentStep >= s.step
                            ? "text-slate-700"
                            : "text-slate-400"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPartner ? (
              /* EDIT MODE - Tabbed Layout */
              <div className="space-y-6">
                {/* Tab selector */}
                <div className="flex border-b border-slate-100 gap-4 mb-4">
                  {[
                    { id: "basic", label: "Basic Info" },
                    { id: "kyc", label: "KYC & Vehicle" },
                    { id: "bankRef", label: "Bank & References" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                        activeTab === t.id
                          ? "border-[#553092] text-[#553092]"
                          : "border-transparent text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {isDetailLoading ? (
                  <div className="text-center py-12 text-slate-400 text-sm font-semibold">
                    Loading details...
                  </div>
                ) : (
                  <div className="max-h-[55vh] overflow-y-auto pr-2 space-y-4">
                    {/* Basic Info Tab */}
                    {activeTab === "basic" && (
                      <div className="space-y-4">
                        <div className="flex flex-col items-center justify-center pb-2">
                          <label className="text-xs font-semibold text-slate-600 mb-2">
                            Profile Image
                          </label>
                          <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 flex items-center justify-center bg-slate-50 group-hover:border-[#553092] transition-colors relative">
                              {profileImgPreview ? (
                                <img
                                  src={profileImgPreview}
                                  alt="Profile Preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-slate-400 text-xs font-medium text-center px-2">
                                  Click to Upload
                                </span>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleFileChange(
                                    e,
                                    setProfileImg,
                                    setProfileImgPreview,
                                  )
                                }
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Full Name"
                            id="name"
                            placeholder="Enter Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                          <Input
                            label="Phone Number"
                            id="phone"
                            placeholder="10-digit number"
                            maxLength={10}
                            value={phone}
                            onChange={(e) =>
                              setPhone(e.target.value.replace(/\D/g, ""))
                            }
                            required
                          />
                          <Input
                            label="Email Address"
                            id="email"
                            type="email"
                            placeholder="Enter Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                          <div className="flex flex-col text-left">
                            <label
                              htmlFor="gender"
                              className="text-xs font-semibold text-slate-600 mb-1.5"
                            >
                              Gender <span className="text-red-500">*</span>
                            </label>
                            <select
                              id="gender"
                              value={gender}
                              onChange={(e) => setGender(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-[#553092]/20 focus:border-[#553092]"
                              required
                            >
                              <option value="">Select Gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Others</option>
                            </select>
                          </div>
                          <Input
                            label="Date of Birth"
                            id="dob"
                            type="date"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            required
                          />
                          <Input
                            label="Address"
                            id="address"
                            placeholder="Enter full address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* KYC & Vehicle Tab */}
                    {activeTab === "kyc" && (
                      <div className="space-y-6">
                        <div className="flex flex-col text-left max-w-md">
                          <label
                            htmlFor="vehicle_type"
                            className="text-xs font-semibold text-slate-600 mb-1.5"
                          >
                            Vehicle Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="vehicle_type"
                            value={vehicle}
                            onChange={(e) => setVehicle(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-[#553092]/20 focus:border-[#553092]"
                            required
                          >
                            <option value="">Select Vehicle Type</option>
                            <option value={VEHICLE_TYPES.BY_HAND}>
                              By Hand
                            </option>
                            <option value={VEHICLE_TYPES.TWO_WHEELER}>
                              Two Wheeler
                            </option>
                            <option value={VEHICLE_TYPES.THREE_WHEELER}>
                              Three Wheeler
                            </option>
                            <option value={VEHICLE_TYPES.FOUR_WHEELER}>
                              Four Wheeler
                            </option>
                          </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col text-left">
                            <label
                              htmlFor="subVehicleTypeEdit"
                              className="text-xs font-semibold text-slate-600 mb-1.5"
                            >
                              Sub Vehicle Type
                            </label>
                            <select
                              id="subVehicleTypeEdit"
                              value={subVehicleType}
                              onChange={(e) =>
                                setSubVehicleType(e.target.value)
                              }
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-[#553092]/20 focus:border-[#553092]"
                              disabled={
                                !vehicle || availableSubcategories.length === 0
                              }
                            >
                              <option value="">Select Sub Vehicle</option>
                              {availableSubcategories.map((subcat) => (
                                <option
                                  key={subcat._id}
                                  value={subcat.sub_vehicle_type}
                                >
                                  {subcat.sub_vehicle_type}
                                </option>
                              ))}
                            </select>
                          </div>
                          <Input
                            label="Other Vehicle Details"
                            id="otherVehicleDetailsEdit"
                            placeholder="Extra info"
                            value={otherVehicleDetails}
                            onChange={(e) =>
                              setOtherVehicleDetails(e.target.value)
                            }
                          />
                          <Input
                            label="Min Capacity (kg)"
                            id="vehicleMinCapacityEdit"
                            type="number"
                            placeholder="Min capacity"
                            value={vehicleMinCapacity}
                            onChange={(e) =>
                              setVehicleMinCapacity(e.target.value)
                            }
                          />
                          <Input
                            label="Max Capacity (kg)"
                            id="vehicleMaxCapacityEdit"
                            type="number"
                            placeholder="Max capacity"
                            value={vehicleMaxCapacity}
                            onChange={(e) =>
                              setVehicleMaxCapacity(e.target.value)
                            }
                          />
                          <Input
                            label="Registration Date"
                            id="vehicleRegistrationDateEdit"
                            type="date"
                            value={vehicleRegistrationDate}
                            onChange={(e) =>
                              setVehicleRegistrationDate(e.target.value)
                            }
                          />
                          <Input
                            label="Insurance Expiry Date"
                            id="insuranceExpiryDateEdit"
                            type="date"
                            value={insuranceExpiryDate}
                            onChange={(e) =>
                              setInsuranceExpiryDate(e.target.value)
                            }
                          />
                          <Input
                            label="Emission Expiry Date"
                            id="emissionExpiryDateEdit"
                            type="date"
                            value={emissionExpiryDate}
                            onChange={(e) =>
                              setEmissionExpiryDate(e.target.value)
                            }
                          />
                          <Input
                            label="Travel Permit States"
                            id="travelPermitStatesEdit"
                            placeholder="e.g. Delhi, Haryana"
                            value={travelPermitStates}
                            onChange={(e) =>
                              setTravelPermitStates(e.target.value)
                            }
                          />
                          <Input
                            label="Permit Expiry Date"
                            id="permitExpiryEdit"
                            type="date"
                            value={permitExpiry}
                            onChange={(e) => setPermitExpiry(e.target.value)}
                          />
                          <div className="flex items-center mt-6">
                            <input
                              type="checkbox"
                              id="isNewVehicleEdit"
                              checked={isNewVehicle}
                              onChange={(e) =>
                                setIsNewVehicle(e.target.checked)
                              }
                              className="mr-2 h-4 w-4 text-[#553092] rounded focus:ring-[#553092]"
                            />
                            <label
                              htmlFor="isNewVehicleEdit"
                              className="text-sm font-semibold text-slate-700"
                            >
                              Is New Vehicle?
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <FileUpload
                            label="Insurance Document"
                            id="insuranceDocumentEdit"
                            preview={insuranceDocumentPreview}
                            onChange={(e) =>
                              handleFileChange(
                                e,
                                setInsuranceDocument,
                                setInsuranceDocumentPreview,
                              )
                            }
                          />
                          <FileUpload
                            label="Emission Certificate"
                            id="emissionCertificateDocumentEdit"
                            preview={emissionCertificateDocumentPreview}
                            onChange={(e) =>
                              handleFileChange(
                                e,
                                setEmissionCertificateDocument,
                                setEmissionCertificateDocumentPreview,
                              )
                            }
                          />
                          <FileUpload
                            label="Permit Document"
                            id="permitDocumentEdit"
                            preview={permitDocumentPreview}
                            onChange={(e) =>
                              handleFileChange(
                                e,
                                setPermitDocument,
                                setPermitDocumentPreview,
                              )
                            }
                          />
                        </div>

                        {/* Aadhar details */}
                        <div>
                          <h4 className="text-xs font-bold text-[#553092] uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
                            1. Aadhar Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                              label="Aadhar Number"
                              id="aadharNumber"
                              placeholder="12-digit number"
                              maxLength={12}
                              value={aadharNumber}
                              onChange={(e) =>
                                setAadharNumber(
                                  e.target.value.replace(/\D/g, ""),
                                )
                              }
                              required
                            />
                            <FileUpload
                              label="Aadhar Front Image"
                              id="aadharImgFront"
                              preview={aadharImgFrontPreview}
                              onChange={(e) =>
                                handleFileChange(
                                  e,
                                  setAadharImgFront,
                                  setAadharImgFrontPreview,
                                )
                              }
                            />
                            <FileUpload
                              label="Aadhar Back Image"
                              id="aadharImgBack"
                              preview={aadharImgBackPreview}
                              onChange={(e) =>
                                handleFileChange(
                                  e,
                                  setAadharImgBack,
                                  setAadharImgBackPreview,
                                )
                              }
                            />
                          </div>
                        </div>

                        {/* RC Details */}
                        <div>
                          <h4 className="text-xs font-bold text-[#553092] uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
                            2. RC Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                              label="RC Number"
                              id="rcNumber"
                              placeholder="Enter RC Number"
                              value={rcNumber}
                              onChange={(e) => setRcNumber(e.target.value)}
                              required
                            />
                            <FileUpload
                              label="RC Front Image"
                              id="rcImgFront"
                              preview={rcImgFrontPreview}
                              onChange={(e) =>
                                handleFileChange(
                                  e,
                                  setRcImgFront,
                                  setRcImgFrontPreview,
                                )
                              }
                            />
                            <FileUpload
                              label="RC Back Image"
                              id="rcImgBack"
                              preview={rcImgBackPreview}
                              onChange={(e) =>
                                handleFileChange(
                                  e,
                                  setRcImgBack,
                                  setRcImgBackPreview,
                                )
                              }
                            />
                          </div>
                        </div>

                        {/* DL Details */}
                        <div>
                          <h4 className="text-xs font-bold text-[#553092] uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
                            3. DL Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                              label="DL Number"
                              id="dlNumber"
                              placeholder="Enter DL Number"
                              value={dlNumber}
                              onChange={(e) => setDlNumber(e.target.value)}
                              required
                            />
                            <Input
                              label="DL Expiry Date"
                              id="dlExpiryDateEdit"
                              type="date"
                              value={dlExpiryDate}
                              onChange={(e) => setDlExpiryDate(e.target.value)}
                            />
                            <FileUpload
                              label="DL Front Image"
                              id="dlImgFront"
                              preview={dlImgFrontPreview}
                              onChange={(e) =>
                                handleFileChange(
                                  e,
                                  setDlImgFront,
                                  setDlImgFrontPreview,
                                )
                              }
                            />
                            <FileUpload
                              label="DL Back Image"
                              id="dlImgBack"
                              preview={dlImgBackPreview}
                              onChange={(e) =>
                                handleFileChange(
                                  e,
                                  setDlImgBack,
                                  setDlImgBackPreview,
                                )
                              }
                            />
                          </div>
                        </div>

                        {/* Vehicle Details */}
                        <div>
                          <h4 className="text-xs font-bold text-[#553092] uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
                            4. Vehicle & Residence Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                              label="Vehicle Number"
                              id="vehicleNumber"
                              placeholder="Enter Vehicle Number"
                              value={vehicleNumber}
                              onChange={(e) => setVehicleNumber(e.target.value)}
                              required
                            />
                            <FileUpload
                              label="Residence Image"
                              id="residenceImg"
                              preview={residenceImgPreview}
                              onChange={(e) =>
                                handleFileChange(
                                  e,
                                  setResidenceImg,
                                  setResidenceImgPreview,
                                )
                              }
                            />
                            <FileUpload
                              label="Vehicle Image"
                              id="vehicleImg"
                              preview={vehicleImgPreview}
                              onChange={(e) =>
                                handleFileChange(
                                  e,
                                  setVehicleImg,
                                  setVehicleImgPreview,
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bank & References Tab */}
                    {activeTab === "bankRef" && (
                      <div className="space-y-6">
                        {/* Bank Details */}
                        <div>
                          <h4 className="text-xs font-bold text-[#553092] uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
                            1. Bank Account Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              label="Bank Name"
                              id="bankName"
                              placeholder="Enter Bank Name"
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                              required
                            />
                            <Input
                              label="Account Number"
                              id="bankAccNumber"
                              placeholder="Enter Account Number"
                              value={bankAccNumber}
                              onChange={(e) =>
                                setBankAccNumber(
                                  e.target.value.replace(/\D/g, ""),
                                )
                              }
                              required
                            />
                            <Input
                              label="IFSC Code"
                              id="bankIfsc"
                              placeholder="e.g. SBIN0001234"
                              value={bankIfsc}
                              onChange={(e) => setBankIfsc(e.target.value)}
                              required
                            />
                            <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2">
                              <FileUpload
                                label="Bank Front Image"
                                id="bankImageFront"
                                preview={bankImageFrontPreview}
                                onChange={(e) =>
                                  handleFileChange(
                                    e,
                                    setBankImageFront,
                                    setBankImageFrontPreview,
                                  )
                                }
                              />
                              <FileUpload
                                label="Bank Back Image"
                                id="bankImgBack"
                                preview={bankImgBackPreview}
                                onChange={(e) =>
                                  handleFileChange(
                                    e,
                                    setBankImgBack,
                                    setBankImgBackPreview,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* References */}
                        <div>
                          <h4 className="text-xs font-bold text-[#553092] uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
                            2. Reference Details
                          </h4>
                          <div className="grid grid-cols-1 gap-6">
                            <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-100">
                              <h5 className="text-xs font-bold text-[#553092] uppercase tracking-wider pb-1 border-b border-slate-200">
                                Reference 1 Details (Optional)
                              </h5>
                              <Input
                                label="Reference Name"
                                id="reference1Name"
                                placeholder="Enter Reference Name"
                                value={reference1Name}
                                onChange={(e) =>
                                  setReference1Name(e.target.value)
                                }
                              />
                              <Input
                                label="Reference Contact"
                                id="reference1Phone"
                                placeholder="10-digit phone number"
                                maxLength={10}
                                value={reference1Phone}
                                onChange={(e) =>
                                  setReference1Phone(
                                    e.target.value.replace(/\D/g, ""),
                                  )
                                }
                              />
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-100">
                              <h5 className="text-xs font-bold text-[#553092] uppercase tracking-wider pb-1 border-b border-slate-200">
                                Reference 2 Details (Optional)
                              </h5>
                              <Input
                                label="Reference 2 Name"
                                id="reference2NameEdit"
                                placeholder="Enter Reference 2 Name"
                                value={reference2Name}
                                onChange={(e) =>
                                  setReference2Name(e.target.value)
                                }
                              />
                              <Input
                                label="Reference 2 Contact"
                                id="reference2PhoneEdit"
                                placeholder="10-digit phone number"
                                maxLength={10}
                                value={reference2Phone}
                                onChange={(e) =>
                                  setReference2Phone(
                                    e.target.value.replace(/\D/g, ""),
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* ADD MODE - 4-Step wizard content */
              <div className="min-h-[35vh]">
                {/* Step 1: Basic Details */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center pb-2">
                      <label className="text-xs font-semibold text-slate-600 mb-2">
                        Profile Image *
                      </label>
                      <div className="relative group cursor-pointer">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 flex items-center justify-center bg-slate-50 group-hover:border-[#553092] transition-colors relative">
                          {profileImgPreview ? (
                            <img
                              src={profileImgPreview}
                              alt="Profile Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-slate-400 text-xs font-semibold text-center px-2">
                              Click to Upload
                            </span>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleFileChange(
                                e,
                                setProfileImg,
                                setProfileImgPreview,
                              )
                            }
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Full Name"
                        id="name"
                        placeholder="Enter Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                      <Input
                        label="Phone Number"
                        id="phone"
                        placeholder="10-digit number"
                        maxLength={10}
                        value={phone}
                        onChange={(e) =>
                          setPhone(e.target.value.replace(/\D/g, ""))
                        }
                        required
                      />
                      <Input
                        label="Email Address"
                        id="email"
                        type="email"
                        placeholder="Enter Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <div className="flex flex-col text-left">
                        <label
                          htmlFor="gender"
                          className="text-xs font-semibold text-slate-600 mb-1.5"
                        >
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="gender"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-[#553092]/20 focus:border-[#553092]"
                          required
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Others</option>
                        </select>
                      </div>
                      <Input
                        label="Date of Birth"
                        id="dob"
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        required
                      />
                      <Input
                        label="Address"
                        id="address"
                        placeholder="Enter full address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Mode of Delivery */}
                {currentStep === 2 && (
                  <div className="space-y-4 max-w-md mx-auto pt-6">
                    <div className="flex flex-col text-left">
                      <label
                        htmlFor="vehicle_type"
                        className="text-xs font-semibold text-slate-600 mb-1.5"
                      >
                        Select Vehicle Type{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="vehicle_type"
                        value={vehicle}
                        onChange={(e) => setVehicle(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-[#553092]/20 focus:border-[#553092]"
                        required
                      >
                        <option value="">Select Vehicle Type</option>
                        <option value={VEHICLE_TYPES.BY_HAND}>By Hand</option>
                        <option value={VEHICLE_TYPES.TWO_WHEELER}>
                          Two Wheeler
                        </option>
                        <option value={VEHICLE_TYPES.THREE_WHEELER}>
                          Three Wheeler
                        </option>
                        <option value={VEHICLE_TYPES.FOUR_WHEELER}>
                          Four Wheeler
                        </option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col text-left">
                        <label
                          htmlFor="subVehicleType"
                          className="text-xs font-semibold text-slate-600 mb-1.5"
                        >
                          Sub Vehicle Type
                        </label>
                        <select
                          id="subVehicleType"
                          value={subVehicleType}
                          onChange={(e) => setSubVehicleType(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-[#553092]/20 focus:border-[#553092]"
                          disabled={
                            !vehicle || availableSubcategories.length === 0
                          }
                        >
                          <option value="">Select Sub Vehicle</option>
                          {availableSubcategories.map((subcat) => (
                            <option
                              key={subcat._id}
                              value={subcat.sub_vehicle_type}
                            >
                              {subcat.sub_vehicle_type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Input
                        label="Other Vehicle Details"
                        id="otherVehicleDetails"
                        placeholder="Extra info"
                        value={otherVehicleDetails}
                        onChange={(e) => setOtherVehicleDetails(e.target.value)}
                      />
                      <Input
                        label="Min Capacity (kg)"
                        id="vehicleMinCapacity"
                        type="number"
                        placeholder="Min capacity"
                        value={vehicleMinCapacity}
                        onChange={(e) => setVehicleMinCapacity(e.target.value)}
                      />
                      <Input
                        label="Max Capacity (kg)"
                        id="vehicleMaxCapacity"
                        type="number"
                        placeholder="Max capacity"
                        value={vehicleMaxCapacity}
                        onChange={(e) => setVehicleMaxCapacity(e.target.value)}
                      />
                      <Input
                        label="Registration Date"
                        id="vehicleRegistrationDate"
                        type="date"
                        value={vehicleRegistrationDate}
                        onChange={(e) =>
                          setVehicleRegistrationDate(e.target.value)
                        }
                      />
                      <Input
                        label="Insurance Expiry Date"
                        id="insuranceExpiryDate"
                        type="date"
                        value={insuranceExpiryDate}
                        onChange={(e) => setInsuranceExpiryDate(e.target.value)}
                      />
                      <Input
                        label="Emission Expiry Date"
                        id="emissionExpiryDate"
                        type="date"
                        value={emissionExpiryDate}
                        onChange={(e) => setEmissionExpiryDate(e.target.value)}
                      />
                      <Input
                        label="Travel Permit States"
                        id="travelPermitStates"
                        placeholder="e.g. Delhi, Haryana"
                        value={travelPermitStates}
                        onChange={(e) => setTravelPermitStates(e.target.value)}
                      />
                      <div className="flex items-center mt-6">
                        <input
                          type="checkbox"
                          id="isNewVehicle"
                          checked={isNewVehicle}
                          onChange={(e) => setIsNewVehicle(e.target.checked)}
                          className="mr-2 h-4 w-4 text-[#553092] rounded focus:ring-[#553092]"
                        />
                        <label
                          htmlFor="isNewVehicle"
                          className="text-sm font-semibold text-slate-700"
                        >
                          Is New Vehicle?
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <FileUpload
                        label="Insurance Document"
                        id="insuranceDocument"
                        preview={insuranceDocumentPreview}
                        onChange={(e) =>
                          handleFileChange(
                            e,
                            setInsuranceDocument,
                            setInsuranceDocumentPreview,
                          )
                        }
                      />
                      <FileUpload
                        label="Emission Certificate"
                        id="emissionCertificateDocument"
                        preview={emissionCertificateDocumentPreview}
                        onChange={(e) =>
                          handleFileChange(
                            e,
                            setEmissionCertificateDocument,
                            setEmissionCertificateDocumentPreview,
                          )
                        }
                      />
                      <FileUpload
                        label="Permit Document"
                        id="permitDocument"
                        preview={permitDocumentPreview}
                        onChange={(e) =>
                          handleFileChange(
                            e,
                            setPermitDocument,
                            setPermitDocumentPreview,
                          )
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Documents & Bank */}
                {currentStep === 3 && (
                  <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                    {/* Aadhar details */}
                    <div>
                      <h4 className="text-xs font-bold text-[#553092] uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
                        1. Aadhar Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          label="Aadhar Number"
                          id="aadharNumber"
                          placeholder="12-digit number"
                          maxLength={12}
                          value={aadharNumber}
                          onChange={(e) =>
                            setAadharNumber(e.target.value.replace(/\D/g, ""))
                          }
                          required
                        />
                        <FileUpload
                          label="Aadhar Front Image"
                          id="aadharImgFront"
                          preview={aadharImgFrontPreview}
                          onChange={(e) =>
                            handleFileChange(
                              e,
                              setAadharImgFront,
                              setAadharImgFrontPreview,
                            )
                          }
                          required
                        />
                        <FileUpload
                          label="Aadhar Back Image"
                          id="aadharImgBack"
                          preview={aadharImgBackPreview}
                          onChange={(e) =>
                            handleFileChange(
                              e,
                              setAadharImgBack,
                              setAadharImgBackPreview,
                            )
                          }
                          required
                        />
                      </div>
                    </div>

                    {/* RC Details */}
                    <div>
                      <h4 className="text-xs font-bold text-[#553092] uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
                        2. RC Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          label="RC Number"
                          id="rcNumber"
                          placeholder="Enter RC Number"
                          value={rcNumber}
                          onChange={(e) => setRcNumber(e.target.value)}
                          required
                        />
                        <FileUpload
                          label="RC Front Image"
                          id="rcImgFront"
                          preview={rcImgFrontPreview}
                          onChange={(e) =>
                            handleFileChange(
                              e,
                              setRcImgFront,
                              setRcImgFrontPreview,
                            )
                          }
                          required
                        />
                        <FileUpload
                          label="RC Back Image"
                          id="rcImgBack"
                          preview={rcImgBackPreview}
                          onChange={(e) =>
                            handleFileChange(
                              e,
                              setRcImgBack,
                              setRcImgBackPreview,
                            )
                          }
                          required
                        />
                      </div>
                    </div>

                    {/* DL Details */}
                    <div>
                      <h4 className="text-xs font-bold text-[#553092] uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
                        3. DL Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          label="DL Number"
                          id="dlNumber"
                          placeholder="Enter DL Number"
                          value={dlNumber}
                          onChange={(e) => setDlNumber(e.target.value)}
                          required
                        />
                        <Input
                          label="DL Expiry Date"
                          id="dlExpiryDate"
                          type="date"
                          value={dlExpiryDate}
                          onChange={(e) => setDlExpiryDate(e.target.value)}
                        />
                        <FileUpload
                          label="DL Front Image"
                          id="dlImgFront"
                          preview={dlImgFrontPreview}
                          onChange={(e) =>
                            handleFileChange(
                              e,
                              setDlImgFront,
                              setDlImgFrontPreview,
                            )
                          }
                          required
                        />
                        <FileUpload
                          label="DL Back Image"
                          id="dlImgBack"
                          preview={dlImgBackPreview}
                          onChange={(e) =>
                            handleFileChange(
                              e,
                              setDlImgBack,
                              setDlImgBackPreview,
                            )
                          }
                          required
                        />
                      </div>
                    </div>

                    {/* Vehicle Details */}
                    <div>
                      <h4 className="text-xs font-bold text-[#553092] uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
                        4. Vehicle & Residence Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          label="Vehicle Number"
                          id="vehicleNumber"
                          placeholder="Enter Vehicle Number"
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value)}
                          required
                        />
                        <FileUpload
                          label="Residence Image"
                          id="residenceImg"
                          preview={residenceImgPreview}
                          onChange={(e) =>
                            handleFileChange(
                              e,
                              setResidenceImg,
                              setResidenceImgPreview,
                            )
                          }
                          required
                        />
                        <FileUpload
                          label="Vehicle Image"
                          id="vehicleImg"
                          preview={vehicleImgPreview}
                          onChange={(e) =>
                            handleFileChange(
                              e,
                              setVehicleImg,
                              setVehicleImgPreview,
                            )
                          }
                          required
                        />
                      </div>
                    </div>

                    {/* Bank Details */}
                    <div>
                      <h4 className="text-xs font-bold text-[#553092] uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
                        5. Bank Account Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Bank Name"
                          id="bankName"
                          placeholder="Enter Bank Name"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          required
                        />
                        <Input
                          label="Account Number"
                          id="bankAccNumber"
                          placeholder="Enter Account Number"
                          value={bankAccNumber}
                          onChange={(e) =>
                            setBankAccNumber(e.target.value.replace(/\D/g, ""))
                          }
                          required
                        />
                        <Input
                          label="IFSC Code"
                          id="bankIfsc"
                          placeholder="e.g. SBIN0001234"
                          value={bankIfsc}
                          onChange={(e) => setBankIfsc(e.target.value)}
                          required
                        />
                        <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2">
                          <FileUpload
                            label="Bank Front Image"
                            id="bankImageFront"
                            preview={bankImageFrontPreview}
                            onChange={(e) =>
                              handleFileChange(
                                e,
                                setBankImageFront,
                                setBankImageFrontPreview,
                              )
                            }
                            required
                          />
                          <FileUpload
                            label="Bank Back Image"
                            id="bankImgBack"
                            preview={bankImgBackPreview}
                            onChange={(e) =>
                              handleFileChange(
                                e,
                                setBankImgBack,
                                setBankImgBackPreview,
                              )
                            }
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: References */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-100">
                        <h5 className="text-xs font-bold text-[#553092] uppercase tracking-wider pb-1 border-b border-slate-200">
                          Reference Details (Optional)
                        </h5>
                        <Input
                          label="Reference Name"
                          id="reference1Name"
                          placeholder="Enter Reference Name"
                          value={reference1Name}
                          onChange={(e) => setReference1Name(e.target.value)}
                        />
                        <Input
                          label="Reference Contact"
                          id="reference1Phone"
                          placeholder="10-digit phone number"
                          maxLength={10}
                          value={reference1Phone}
                          onChange={(e) =>
                            setReference1Phone(
                              e.target.value.replace(/\D/g, ""),
                            )
                          }
                        />
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-100">
                        <h5 className="text-xs font-bold text-[#553092] uppercase tracking-wider pb-1 border-b border-slate-200">
                          Reference 2 Details (Optional)
                        </h5>
                        <Input
                          label="Reference 2 Name"
                          id="reference2Name"
                          placeholder="Enter Reference 2 Name"
                          value={reference2Name}
                          onChange={(e) => setReference2Name(e.target.value)}
                        />
                        <Input
                          label="Reference 2 Contact"
                          id="reference2Phone"
                          placeholder="10-digit phone number"
                          maxLength={10}
                          value={reference2Phone}
                          onChange={(e) =>
                            setReference2Phone(
                              e.target.value.replace(/\D/g, ""),
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Form actions / Stepper controls */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                onClick={handleCloseModal}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>

              {selectedPartner ? (
                /* Edit mode submit buttons */
                <Button
                  type="submit"
                  isLoading={isSubmit}
                  variant="primary"
                  size="sm"
                  className="bg-[#553092] hover:bg-[#442474] text-white border-none"
                  disabled={isDetailLoading}
                >
                  Save Changes
                </Button>
              ) : (
                /* Add mode stepper buttons */
                <>
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      onClick={() => setCurrentStep((prev) => prev - 1)}
                      variant="outline"
                      size="sm"
                    >
                      Back
                    </Button>
                  )}
                  {currentStep < 4 ? (
                    <Button
                      type="button"
                      onClick={() => {
                        if (validateStep(currentStep)) {
                          setCurrentStep((prev) => prev + 1);
                        }
                      }}
                      variant="primary"
                      size="sm"
                      className="bg-[#553092] hover:bg-[#442474] text-white border-none"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      isLoading={isSubmit}
                      variant="primary"
                      size="sm"
                      className="bg-[#553092] hover:bg-[#442474] text-white border-none"
                    >
                      Create Partner
                    </Button>
                  )}
                </>
              )}
            </div>
          </form>
        </Modal>
      )}

      {/* Reusable Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteId(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Delivery Partner"
          message="Are you sure you want to delete this delivery partner? This action will permanently remove their records from the system."
          confirmLabel="Delete Partner"
          variant="danger"
          isLoading={isDeleteLoading}
        />
      )}

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      <BulkUploadDpModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => {
          setIsBulkModalOpen(false);
          fetchPartners();
        }}
      />

      {/* Bulk Reject Modal */}
      {showBulkRejectModal && (
        <Modal
          isOpen={showBulkRejectModal}
          onClose={() => {
            if (isBulkProcessing) return;
            setShowBulkRejectModal(false);
            setBulkRejectReason("");
            setBulkRejectDpId(null);
          }}
          title="Reject Partner & Pending Documents"
          size="md"
        >
          <div className="p-4 space-y-4">
            <p className="text-sm text-slate-600">
              Provide a reason for rejecting this partner and all their
              currently pending documents.
            </p>
            <Input
              label="Reason for Rejection"
              placeholder="e.g. Documents are unclear, invalid information..."
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBulkRejectModal(false);
                  setBulkRejectReason("");
                  setBulkRejectDpId(null);
                }}
                disabled={isBulkProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmBulkReject}
                disabled={!bulkRejectReason.trim() || isBulkProcessing}
                isLoading={isBulkProcessing}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default DeliveryPartners;
