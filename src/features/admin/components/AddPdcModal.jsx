import { useState } from "react";
import Modal from "../../../components/common/Modal";
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
import { adminAddPdc } from "../../../api/admin.api";
import toast from "react-hot-toast";
import { FolderUp } from "lucide-react";

// Reusable File Upload Preview Component
const FileUpload = ({ label, id, preview, onChange, required, accept }) => (
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
          <span className="text-[10px] font-semibold mt-1">Upload file</span>
        </div>
      )}
      <input
        type="file"
        id={id}
        accept={accept || "image/*"}
        onChange={onChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </div>
  </div>
);

const AddPdcModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    state: "",
    district: "",
    pincode: "",
    bank_name: "",
    bank_acc_no: "",
    bank_ifsc: "",
    aadhar: "",
    pan: "",
    gst: "",
  });

  const [fileData, setFileData] = useState({
    profile_image: null,
    shop_image: null,
    aadhar_front_image: null,
    aadhar_back_image: null,
    pancard_image: null,
    passbook_image: null,
    gst_doc: null,
  });

  const [filePreviews, setFilePreviews] = useState({
    profile_image: null,
    shop_image: null,
    aadhar_front_image: null,
    aadhar_back_image: null,
    pancard_image: null,
    passbook_image: null,
    gst_doc: null,
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e) => {
    const { id, files } = e.target;
    if (files && files[0]) {
      setFileData((prev) => ({ ...prev, [id]: files[0] }));
      setFilePreviews((prev) => ({ ...prev, [id]: URL.createObjectURL(files[0]) }));
    }
  };

  const validateStep1 = () => {
    if (
      !formData.name ||
      !formData.phone ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      toast.error("Please fill in all basic mandatory fields");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    // KYC and Bank fields are optional based on DB schema, so we do not block submission.
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setIsLoading(true);
    try {
      const data = new FormData();
      // append text data
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      // append files
      Object.keys(fileData).forEach((key) => {
        if (fileData[key]) {
          data.append(key, fileData[key]);
        }
      });

      const response = await adminAddPdc(data);
      if (response.data?.success || response.status === 200) {
        toast.success("PDC Added and Verified Successfully!");
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add PDC");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        step === 1
          ? "Add PDC - Step 1 (Basic Details)"
          : "Add PDC - Step 2 (Documents)"
      }
      size="3xl"
    >
      <div className="hide-scrollbar space-y-4 pt-4 max-h-[65vh] overflow-y-auto px-1">
        {step === 1 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="name"
                label="Full Name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <Input
                id="email"
                type="email"
                label="Email Address"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <Input
                id="phone"
                label="Phone Number"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleInputChange}
                maxLength={10}
                required
              />
              <Input
                id="password"
                type="password"
                label="Password"
                placeholder="Set password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <Input
                id="confirmPassword"
                type="password"
                label="Confirm Password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
              <div className="md:col-span-2">
                <Input
                  id="address"
                  label="Address"
                  placeholder="Full Address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Input
                id="city"
                label="City"
                placeholder="City"
                value={formData.city}
                onChange={handleInputChange}
                required
              />
              <Input
                id="state"
                label="State"
                placeholder="State"
                value={formData.state}
                onChange={handleInputChange}
                required
              />
              <Input
                id="district"
                label="District"
                placeholder="District"
                value={formData.district}
                onChange={handleInputChange}
                required
              />
              <Input
                id="pincode"
                label="Pincode"
                placeholder="Pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                required
              />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            {/* Identity Documents */}
            <div className="md:col-span-2 text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">
              Identity Verification
            </div>
            <Input
              id="aadhar"
              label="Aadhar Number"
              placeholder="Aadhar Number"
              value={formData.aadhar}
              onChange={handleInputChange}
              required
            />
            <div className="grid grid-cols-2 gap-2 md:col-span-2">
              <FileUpload
                id="aadhar_front_image"
                label="Aadhar Front Image"
                onChange={handleFileChange}
                preview={filePreviews.aadhar_front_image}
                accept="image/*"
                required
              />
              <FileUpload
                id="aadhar_back_image"
                label="Aadhar Back Image"
                onChange={handleFileChange}
                preview={filePreviews.aadhar_back_image}
                accept="image/*"
                required
              />
            </div>

            <Input
              id="pan"
              label="PAN Number"
              placeholder="PAN Number"
              value={formData.pan}
              onChange={handleInputChange}
              required
            />
            <FileUpload
              id="pancard_image"
              label="PAN Card Image"
              onChange={handleFileChange}
              preview={filePreviews.pancard_image}
              accept="image/*"
              required
            />

            {/* Business Documents */}
            <div className="md:col-span-2 text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 mt-2">
              Business Documents
            </div>
            <Input
              id="gst"
              label="GST Number (Optional)"
              placeholder="GST Number"
              value={formData.gst}
              onChange={handleInputChange}
            />
            <FileUpload
              id="gst_doc"
              label="GST Document (Optional)"
              onChange={handleFileChange}
              preview={filePreviews.gst_doc}
              accept="image/*,.pdf"
            />
            <FileUpload
              id="profile_image"
              label="Owner Profile Image"
              onChange={handleFileChange}
              preview={filePreviews.profile_image}
              accept="image/*"
              required
            />
            <FileUpload
              id="shop_image"
              label="Shop Front Image"
              onChange={handleFileChange}
              preview={filePreviews.shop_image}
              accept="image/*"
            />

            {/* Bank Details */}
            <div className="md:col-span-2 text-sm font-bold text-slate-700 border-b border-slate-100 pb-2 mt-2">
              Bank Details
            </div>
            <Input
              id="bank_name"
              label="Bank Name"
              placeholder="Bank Name"
              value={formData.bank_name}
              onChange={handleInputChange}
              required
            />
            <FileUpload
              id="passbook_image"
              label="Bank Passbook / Cancelled Cheque"
              onChange={handleFileChange}
              preview={filePreviews.passbook_image}
              accept="image/*"
              required
            />
            <Input
              id="bank_acc_no"
              label="Bank Account No"
              placeholder="Account No"
              value={formData.bank_acc_no}
              onChange={handleInputChange}
              required
            />
            <Input
              id="bank_ifsc"
              label="Bank IFSC Code"
              placeholder="IFSC Code"
              value={formData.bank_ifsc}
              onChange={handleInputChange}
              required
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        {step === 1 ? (
          <Button variant="primary" onClick={handleNext}>
            Next Step
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleBack} disabled={isLoading}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isLoading}
            >
              Submit & Verify PDC
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default AddPdcModal;
