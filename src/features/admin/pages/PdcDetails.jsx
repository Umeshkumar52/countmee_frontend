import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPdcDetails as apiFetchPdcDetails, updateDocumentStatus, updatePdcLocation } from '../../../api/admin.api';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Input from '../../../components/common/Input';
import Modal from '../../../components/common/Modal';

export const PdcDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pdc, setPdc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Operational details update states
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  // Document rejection reasons states
  const [rejectionReasons, setRejectionReasons] = useState({
    aadhar: '',
    pan: '',
    gst: '',
    bank: ''
  });
  const [showRejectForm, setShowRejectForm] = useState({
    aadhar: false,
    pan: false,
    gst: false,
    bank: false
  });

  // Modal viewer state
  const [viewerModal, setViewerModal] = useState({
    isOpen: false,
    title: '',
    images: []
  });

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const serverBase = apiBase.replace(/\/api\/?$/, '');
    const cleanPath = path.replace(/^\/?(uploads\/)?/, '');
    return `${serverBase}/uploads/${cleanPath}`;
  };

  const handleViewDocument = (name, images) => {
    setViewerModal({
      isOpen: true,
      title: `View Document: ${name}`,
      images: images
    });
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
      setCity(pdcData?.city || '');
      setAddress(pdcData?.address || '');
    } catch (e) {
      console.error('Failed to load PDC details', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPdcDetails();
  }, [id]);

  const handleDocumentAction = async (docType, status, reason = '') => {
    try {
      await updateDocumentStatus({
        pdcId: id,
        type: docType,
        status,
        reason
      });
      
      // Reset reason and toggles
      setRejectionReasons(prev => ({ ...prev, [docType]: '' }));
      setShowRejectForm(prev => ({ ...prev, [docType]: false }));
      
      // Reload details
      fetchPdcDetails();
    } catch (e) {
      console.error('Failed to update document status', e);
    }
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    setIsUpdatingLocation(true);
    try {
      await updatePdcLocation(id, { city, address });
      alert('Operational location updated successfully!');
      fetchPdcDetails();
    } catch (e) {
      console.error('Failed to update location', e);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-slate-400">Loading PDC profile details...</div>;
  }

  if (!pdc) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>PDC Hub not found.</p>
        <Button onClick={() => navigate('/admin/pdc-list')} size="sm" className="mt-4">
          Back to List
        </Button>
      </div>
    );
  }

  const documentItems = [
    {
      key: 'aadhar',
      name: 'Aadhar Card Proof',
      status: pdc.aadhar_status,
      reason: pdc.aadhar_reject_reason,
      images: [
        { label: 'Front Image', path: pdc.aadhar_front_image },
        { label: 'Back Image', path: pdc.aadhar_back_image }
      ].filter(img => img.path)
    },
    {
      key: 'pan',
      name: 'PAN Card Details',
      status: pdc.pan_status,
      reason: pdc.pan_reject_reason,
      images: [
        { label: 'PAN Card Image', path: pdc.pancard_image }
      ].filter(img => img.path)
    },
    {
      key: 'gst',
      name: 'GST Certification',
      status: pdc.gst_status,
      reason: pdc.gst_reject_reason,
      images: [
        { label: 'GST Document', path: pdc.gst_doc }
      ].filter(img => img.path)
    },
    {
      key: 'bank',
      name: 'Bank Details (Cheque/Passbook)',
      status: pdc.bank_status,
      reason: pdc.bank_reject_reason,
      images: [
        { label: 'Passbook/Cheque Image', path: pdc.passbook_image }
      ].filter(img => img.path)
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left page-transition">
      <div className="flex items-center gap-3">
        <Button onClick={() => navigate('/admin/pdc-list')} variant="outline" size="sm">
          ← Back
        </Button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">PDC Review: {pdc.userDetails?.name}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Evaluate onboarding credentials and coordinate locations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Profile & Location update form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Details card */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Store Profile</h3>
            <div className="flex flex-col items-center pb-4 border-b border-slate-50 mb-4">
              <div className="w-16 h-16 bg-brand-purple-soft rounded-xl flex items-center justify-center text-brand-purple font-extrabold text-xl mb-3 border border-brand-purple/10">
                PDC
              </div>
              <h4 className="font-bold text-slate-800 text-sm">{pdc.userDetails?.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{pdc.userDetails?.phone}</p>
            </div>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="font-semibold text-slate-700 truncate max-w-[150px]">{pdc.userDetails?.email}</span>
              </div>
              <div className="flex justify-between">
                <span>Lat/Long:</span>
                <span className="font-semibold text-slate-700">{pdc.latitude || '0.0'}, {pdc.longitude || '0.0'}</span>
              </div>
              <div className="flex justify-between">
                <span>Store Hub:</span>
                <span className="font-semibold text-slate-700">{pdc.city || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Location Update form */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Update Hub Location</h3>
            <form onSubmit={handleUpdateLocation} className="space-y-4">
              <Input
                label="City Hub"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
              <div className="flex flex-col text-left">
                <label htmlFor="address" className="text-xs font-semibold text-slate-600 mb-1.5">
                  Full Store Address
                </label>
                <textarea
                  id="address"
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple"
                />
              </div>
              <Button type="submit" isLoading={isUpdatingLocation} variant="primary" size="sm" className="w-full">
                Save Hub Location
              </Button>
            </form>
          </div>
        </div>

        {/* Right Side: Document evaluation */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wide pl-1">Store KYC Files</h3>
          
          <div className="space-y-4">
            {documentItems.map((doc) => {
              const isApproved = doc.status === 'approved' || doc.status === 'Accept';
              const isRejected = doc.status === 'rejected' || doc.status === 'Reject';

              return (
                <div key={doc.key} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-sm">{doc.name}</h4>
                        <Badge variant={
                          isApproved ? 'success' : isRejected ? 'danger' : 'warning'
                        }>
                          {isApproved ? 'Approved' : isRejected ? 'Rejected' : (doc.status || 'Pending Review')}
                        </Badge>
                      </div>
                      {doc.reason && isRejected && (
                        <p className="text-[10px] text-red-500 font-medium mt-1">Rejection reason: {doc.reason}</p>
                      )}
                      {doc.images && doc.images.length > 0 ? (
                        <button
                          onClick={() => handleViewDocument(doc.name, doc.images)}
                          className="text-brand-purple text-xs font-semibold hover:underline mt-2 inline-flex items-center gap-1 cursor-pointer"
                        >
                          👁️ View Document Copy
                        </button>
                      ) : (
                        <p className="text-xs text-slate-400 mt-2 italic">No document image uploaded</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        onClick={() => handleDocumentAction(doc.key, 'approved')}
                        variant={isApproved ? 'success' : 'outline'}
                        size="sm"
                        className="py-1 px-3 text-xs"
                      >
                        ✓ Approve
                      </Button>
                      <Button
                        onClick={() => setShowRejectForm(prev => ({ ...prev, [doc.key]: !prev[doc.key] }))}
                        variant={isRejected ? 'danger' : 'outline'}
                        size="sm"
                        className="py-1 px-3 text-xs"
                      >
                        ✗ Reject
                      </Button>
                    </div>
                  </div>

                {/* Reject Details form */}
                {showRejectForm[doc.key] && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 transition-all">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Provide Rejection Reason</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Blurred photocopy, expired certificate..."
                      value={rejectionReasons[doc.key]}
                      onChange={(e) => setRejectionReasons(prev => ({ ...prev, [doc.key]: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs transition-all outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500"
                    />
                    <div className="flex justify-end gap-1.5">
                      <Button
                        onClick={() => setShowRejectForm(prev => ({ ...prev, [doc.key]: false }))}
                        variant="secondary"
                        size="sm"
                        className="py-1 px-2.5 text-[10px]"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleDocumentAction(doc.key, 'rejected', rejectionReasons[doc.key])}
                        variant="danger"
                        size="sm"
                        className="py-1 px-2.5 text-[10px]"
                      >
                        Submit Rejection
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>

      </div>

      {/* Document Viewer Modal */}
      <Modal
        isOpen={viewerModal.isOpen}
        onClose={() => setViewerModal(prev => ({ ...prev, isOpen: false }))}
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
                    e.target.src = 'https://placehold.co/600x400?text=Failed+to+load+image';
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
