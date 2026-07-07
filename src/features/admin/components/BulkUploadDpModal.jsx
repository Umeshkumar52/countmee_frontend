import React, { useState } from "react";
import * as XLSX from "xlsx";
import Modal from "../../../components/common/Modal";
import Button from "../../../components/common/Button";
import { bulkAddPartner } from "../../../api/admin.api";

const BulkUploadDpModal = ({ isOpen, onClose, onSuccess }) => {
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  const [generalError, setGeneralError] = useState("");

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setErrors([]);
    setGeneralError("");
  };

  const handleDownloadTemplate = () => {
    const headers = "Name,Phone,Email,DOB,Gender,Address,Vehicle Type,Vehicle Number,Aadhar Number,RC Number,DL Number,Bank Name,Bank Account Number,Bank IFSC,Reference 1 Name,Reference 1 Phone,Profile Image Filename,Aadhar Front Image Filename,Aadhar Back Image Filename,RC Front Image Filename,RC Back Image Filename,DL Front Image Filename,DL Back Image Filename,Bank Front Image Filename,Bank Back Image Filename,Residence Image Filename,Vehicle Image Filename\n";
    const example1 = "John Doe,9876543210,john@example.com,1995-05-20,Male,123 Main St,Two Wheeler,KA01AB1234,123412341234,RC98765,DL123456,HDFC,123456789012,HDFC0001234,Bob,9998887776,john_profile.jpg,john_aadhar_front.jpg,john_aadhar_back.png,,,,,,,,,\n";
    const example2 = "Jane Smith,9123456780,,,,,Four Wheeler,MH02XY9876,,,,,,,,,,,,,,,,,,,\n";
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + example1 + example2;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "dp_bulk_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          resolve(json);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setGeneralError("Please select an Excel file (and any images) to upload.");
      return;
    }

    const excelFile = files.find(f => f.name.endsWith(".xlsx") || f.name.endsWith(".xls") || f.name.endsWith(".csv"));
    if (!excelFile) {
      setGeneralError("No Excel/CSV file found in your selection.");
      return;
    }

    const imageFiles = files.filter(f => f !== excelFile);

    setIsSubmitting(true);
    setErrors([]);
    setGeneralError("");

    try {
      // 1. Parse Excel locally
      const rows = await processExcel(excelFile);
      
      if (rows.length === 0) {
        setGeneralError("The Excel sheet is empty.");
        setIsSubmitting(false);
        return;
      }

      // Format data according to the expected backend fields based on headers
      const formattedData = rows.map((row, index) => ({
        row: index + 2, // Excel rows are 1-indexed, header is 1, data starts at 2
        name: String(row["Name"] || row["name"] || "").trim(),
        phone: String(row["Phone"] || row["phone"] || "").trim(),
        email: String(row["Email"] || row["email"] || "").trim(),
        dob: String(row["DOB"] || row["dob"] || "").trim(),
        gender: String(row["Gender"] || row["gender"] || "").trim(),
        address: String(row["Address"] || row["address"] || "").trim(),
        vehicle_type: String(row["Vehicle Type"] || row["vehicle_type"] || row["vehicleType"] || "").trim(),
        vehicle_number: String(row["Vehicle Number"] || row["vehicle_number"] || row["vehicleNumber"] || "").trim(),
        aadhar_number: String(row["Aadhar Number"] || row["aadhar_number"] || row["aadharNumber"] || "").trim(),
        rc_number: String(row["RC Number"] || row["rc_number"] || row["rcNumber"] || "").trim(),
        dl_number: String(row["DL Number"] || row["dl_number"] || row["dlNumber"] || "").trim(),
        bank_name: String(row["Bank Name"] || row["bank_name"] || row["bankName"] || "").trim(),
        bank_acc_number: String(row["Bank Account Number"] || row["bank_acc_number"] || row["bankAccountNumber"] || "").trim(),
        bank_ifsc: String(row["Bank IFSC"] || row["bank_ifsc"] || row["bankIfsc"] || "").trim(),
        reference1_name: String(row["Reference 1 Name"] || row["reference1_name"] || row["reference1Name"] || "").trim(),
        reference1_phone: String(row["Reference 1 Phone"] || row["reference1_phone"] || row["reference1Phone"] || "").trim(),
        profile_img: String(row["Profile Image Filename"] || row["Profile Image URL"] || row["Profile Image"] || row["profile_img"] || "").trim(),
        aadhar_imgfront: String(row["Aadhar Front Image Filename"] || row["Aadhar Front Image URL"] || row["Aadhar Front Image"] || row["aadhar_imgfront"] || "").trim(),
        aadhar_imgback: String(row["Aadhar Back Image Filename"] || row["Aadhar Back Image URL"] || row["Aadhar Back Image"] || row["aadhar_imgback"] || "").trim(),
        rc_imgfront: String(row["RC Front Image Filename"] || row["RC Front Image URL"] || row["RC Front Image"] || row["rc_imgfront"] || "").trim(),
        rc_imgback: String(row["RC Back Image Filename"] || row["RC Back Image URL"] || row["RC Back Image"] || row["rc_imgback"] || "").trim(),
        dl_imgfront: String(row["DL Front Image Filename"] || row["DL Front Image URL"] || row["DL Front Image"] || row["dl_imgfront"] || "").trim(),
        dl_imgback: String(row["DL Back Image Filename"] || row["DL Back Image URL"] || row["DL Back Image"] || row["dl_imgback"] || "").trim(),
        bank_imagefront: String(row["Bank Front Image Filename"] || row["Bank Front Image URL"] || row["Bank Front Image"] || row["bank_imagefront"] || "").trim(),
        bank_imageback: String(row["Bank Back Image Filename"] || row["Bank Back Image URL"] || row["Bank Back Image"] || row["bank_imageback"] || "").trim(),
        residence_img: String(row["Residence Image Filename"] || row["Residence Image URL"] || row["Residence Image"] || row["residence_img"] || "").trim(),
        vehicle_img: String(row["Vehicle Image Filename"] || row["Vehicle Image URL"] || row["Vehicle Image"] || row["vehicle_img"] || "").trim()
      }));

      // Create FormData
      const formData = new FormData();
      formData.append("data", JSON.stringify(formattedData));

      // Append matched images
      const imageKeys = [
        "profile_img", "aadhar_imgfront", "aadhar_imgback", 
        "rc_imgfront", "rc_imgback", "dl_imgfront", "dl_imgback", 
        "bank_imagefront", "bank_imageback", "residence_img", "vehicle_img"
      ];

      formattedData.forEach((dpRow, index) => {
        imageKeys.forEach(key => {
          if (dpRow[key]) {
            const matchedFile = imageFiles.find(f => f.name === dpRow[key]);
            if (matchedFile) {
              formData.append(`row_${index}_${key}`, matchedFile);
            }
          }
        });
      });

      // 2. Send FormData to backend
      await bulkAddPartner(formData);
      
      onSuccess();
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setGeneralError(err.response?.data?.message || err.message || "An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Upload Delivery Partners" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-700">
              Upload Excel File & Images
            </label>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="text-xs font-semibold text-brand-purple hover:text-brand-purple/80 underline"
            >
              Download Sample Template
            </button>
          </div>
          <input
            type="file"
            multiple
            accept=".xlsx, .xls, .csv, image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-xl file:border-0
              file:text-sm file:font-semibold
              file:bg-[#e8eedd] file:text-[#553092]
              hover:file:bg-[#d8e0c8]"
          />
          <p className="mt-2 text-xs text-slate-500">
            Select your Excel file and ALL required images at the same time. Ensure the Excel sheet contains the exact filenames (e.g. "john_aadhar.jpg").
          </p>
          {files.length > 0 && (
            <div className="mt-2 text-xs font-semibold text-brand-purple">
              {files.length} file(s) selected
            </div>
          )}
        </div>

        {generalError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {generalError}
          </div>
        )}

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-red-100 border-b border-red-200 text-red-800 font-semibold text-sm">
              Validation Errors Found ({errors.length})
            </div>
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-sm text-left text-red-600">
                <thead className="bg-red-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 font-medium">Excel Row</th>
                    <th className="px-4 py-2 font-medium">Error Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-200">
                  {errors.map((err, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 whitespace-nowrap">Row {err.row}</td>
                      <td className="px-4 py-2">{err.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={files.length === 0 || isSubmitting}
            isLoading={isSubmitting}
          >
            Upload and Process
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default BulkUploadDpModal;
