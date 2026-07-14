import toast from 'react-hot-toast';
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
  const [uploadProgress, setUploadProgress] = useState({ total: 0, current: 0 });

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setErrors([]);
    setGeneralError("");
  };

  const handleDownloadTemplate = () => {
    const headers = "Name,Phone,Email,DOB,Gender,Address,Vehicle Type,Vehicle Number,Aadhar Number,RC Number,DL Number,Bank Name,Bank Account Number,Bank IFSC,Reference 1 Name,Reference 1 Phone,Reference 2 Name,Reference 2 Phone,DL Expiry Date,Sub Vehicle Type,Other Vehicle Details,Vehicle Min Capacity,Vehicle Max Capacity,Insurance Expiry Date,Emission Expiry Date,Is New Vehicle,Vehicle Registration Date,Travel Permit States,Permit Expiry,Profile Image Filename,Aadhar Front Image Filename,Aadhar Back Image Filename,RC Front Image Filename,RC Back Image Filename,DL Front Image Filename,DL Back Image Filename,Bank Front Image Filename,Bank Back Image Filename,Residence Image Filename,Vehicle Image Filename,Insurance Document Filename,Emission Document Filename,Permit Document Filename\n";
    const example1 = "Raju Tester,9876543210,raju@test.com,1995-05-20,Male,123 Delivery Street,Two Wheeler,KA01AB1234,123412341234,RC987654,DL123456,HDFC,123456789012,HDFC0001234,Amit,9998887776,Rahul,9998887775,2030-05-20,Bike,Honda Activa,10,50,2025-05-20,2024-05-20,false,2018-05-20,\"Karnataka, Maharashtra\",2025-05-20,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg\n";
    const example2 = "Vikram Driver,9123456780,vikram@test.com,1992-10-15,Male,456 Logistics Ave,Four Wheeler,MH02XY9876,987698769876,RC112233,DL998877,ICICI,987654321098,ICIC0009876,Rahul,9991112223,Amit,9991112224,2032-10-15,Truck,Tata Ace,500,1000,2025-10-15,2024-10-15,true,2023-10-15,\"All India Permit (AIP)\",2025-10-15,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg,test_image.jpg\n";
    
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
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
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
    
    if (imageFiles.length === 0) {
      setGeneralError("You only selected the CSV file! You must highlight both the CSV file AND the image files at the same time.");
      return;
    }

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
        reference2_name: String(row["Reference 2 Name"] || "").trim(),
        reference2_phone: String(row["Reference 2 Phone"] || "").trim(),
        dl_expiry_date: String(row["DL Expiry Date"] || "").trim(),
        sub_vehicle_type: String(row["Sub Vehicle Type"] || "").trim(),
        other_vehicle_details: String(row["Other Vehicle Details"] || "").trim(),
        vehicle_min_capacity: String(row["Vehicle Min Capacity"] || "").trim(),
        vehicle_max_capacity: String(row["Vehicle Max Capacity"] || "").trim(),
        insurance_expiry_date: String(row["Insurance Expiry Date"] || "").trim(),
        emission_expiry_date: String(row["Emission Expiry Date"] || "").trim(),
        is_new_vehicle: String(row["Is New Vehicle"] || "").trim(),
        vehicle_registration_date: String(row["Vehicle Registration Date"] || "").trim(),
        travel_permit_states: String(row["Travel Permit States"] || "").trim(),
        permit_expiry: String(row["Permit Expiry"] || "").trim(),
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
        vehicle_img: String(row["Vehicle Image Filename"] || row["Vehicle Image URL"] || row["Vehicle Image"] || row["vehicle_img"] || "").trim(),
        insurance_document: String(row["Insurance Document Filename"] || "").trim(),
        emission_certificate_document: String(row["Emission Document Filename"] || "").trim(),
        permit_document: String(row["Permit Document Filename"] || "").trim()
      }));

      // Begin Chunked Upload Process
      setUploadProgress({ total: formattedData.length, current: 0 });
      let localErrors = [];
      let successCount = 0;

      const imageKeys = [
        "profile_img", "aadhar_imgfront", "aadhar_imgback", 
        "rc_imgfront", "rc_imgback", "dl_imgfront", "dl_imgback", 
        "bank_imagefront", "bank_imageback", "residence_img", "vehicle_img",
        "insurance_document", "emission_certificate_document", "permit_document"
      ];

      for (let i = 0; i < formattedData.length; i++) {
        const dpRow = formattedData[i];
        
        try {
          const formData = new FormData();
          // We send exactly one DP in the array. Its array index is 0.
          formData.append("data", JSON.stringify([dpRow]));

          imageKeys.forEach(key => {
            if (dpRow[key]) {
              const fileNameToMatch = dpRow[key].trim().toLowerCase();
              const matchedFile = imageFiles.find(f => 
                f.name.toLowerCase() === fileNameToMatch || 
                f.name.toLowerCase() === `${fileNameToMatch}.jpg` || 
                f.name.toLowerCase() === `${fileNameToMatch}.png`
              );
              
              if (matchedFile) {
                const uniqueFile = new File([matchedFile], matchedFile.name, { type: matchedFile.type });
                // Append with index 0 because the backend dps array will only have length 1
                formData.append(`row_0_${key}`, uniqueFile);
              }
            }
          });

          await bulkAddPartner(formData);
          successCount++;
        } catch (err) {
          console.error(`Row ${dpRow.row} failed:`, err);
      toast.error("Row ${dpRow.row} failed:");
          if (err.response?.data?.errors) {
            localErrors.push(...err.response.data.errors);
          } else {
            localErrors.push({ row: dpRow.row, error: err.response?.data?.message || err.message || "Failed to upload" });
          }
        }
        
        // Update Progress
        setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
      }

      setErrors(localErrors);

      if (successCount > 0 && localErrors.length === 0) {
        onSuccess();
      } else if (successCount > 0 && localErrors.length > 0) {
        setGeneralError(`Successfully uploaded ${successCount} DPs. ${localErrors.length} rows failed. See below.`);
      } else if (successCount === 0) {
        setGeneralError(`All rows failed to upload. See errors below.`);
      }

    } catch (err) {
      console.error("Top level processing error:", err);
      toast.error("Top level processing error:");
      setGeneralError(err.message || "An unexpected error occurred during processing.");
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

          {isSubmitting && uploadProgress.total > 0 && (
            <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-100 shadow-inner">
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                <span>Processing Uploads...</span>
                <span className="text-brand-purple">{uploadProgress.current} / {uploadProgress.total}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-brand-purple h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%` }} 
                />
              </div>
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
