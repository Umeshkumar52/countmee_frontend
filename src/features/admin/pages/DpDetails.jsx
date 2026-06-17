import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPartners } from '../../../api/admin.api';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';

export const DpDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Verification document statuses state
  const [docs, setDocs] = useState({
    aadhar: 'pending',
    license: 'pending',
    rc: 'pending'
  });

  const fetchPartnerDetails = async () => {
    setIsLoading(true);
    try {
      // Get partners and find the matching ID
      const response = await fetchPartners();
      const match = response.data.find(d => d.id === parseInt(id));
      if (match) {
        setPartner(match);
      }
    } catch (e) {
      console.error('Failed to load partner details', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerDetails();
  }, [id]);

  const handleUpdateStatus = (docType, status) => {
    setDocs(prev => ({ ...prev, [docType]: status }));
  };

  if (isLoading) {
    return <div className="text-center py-12 text-slate-400">Loading partner details...</div>;
  }

  if (!partner) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>Delivery Partner not found.</p>
        <Button onClick={() => navigate('/admin/delivery-partners')} size="sm" className="mt-4">
          Back to List
        </Button>
      </div>
    );
  }

  const documentItems = [
    { key: 'aadhar', name: 'Aadhar Card Proof', status: docs.aadhar },
    { key: 'license', name: 'Driving License', status: docs.license },
    { key: 'rc', name: 'Vehicle Registration Certificate (RC)', status: docs.rc }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left page-transition">
      <div className="flex items-center gap-3">
        <Button onClick={() => navigate('/admin/delivery-partners')} variant="outline" size="sm">
          ← Back
        </Button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Review Partner: {partner.name}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Evaluate submitted files for KYC compliance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="md:col-span-1 bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col items-center">
          <div className="w-20 h-20 bg-brand-purple-soft rounded-full flex items-center justify-center text-brand-purple font-extrabold text-2xl mb-4 border border-brand-purple/10">
            {partner.name.slice(0, 2).toUpperCase()}
          </div>
          <h3 className="font-bold text-slate-800 text-base">{partner.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{partner.phone}</p>
          <p className="text-xs text-slate-400 truncate w-full text-center mt-0.5">{partner.email}</p>
          
          <div className="w-full border-t border-slate-50 mt-5 pt-5 space-y-3 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Vehicle:</span>
              <span className="font-semibold text-slate-700">{partner.vehicle || 'Bike'}</span>
            </div>
            <div className="flex justify-between">
              <span>Active Orders:</span>
              <span className="font-semibold text-slate-700">{partner.active_orders}</span>
            </div>
            <div className="flex justify-between">
              <span>Rating:</span>
              <span className="font-semibold text-amber-500">⭐ {partner.rating || '5.0'}</span>
            </div>
          </div>
        </div>

        {/* Documents list & checks */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wide pl-1">Submitted KYC Files</h3>
          
          <div className="space-y-4">
            {documentItems.map((doc) => (
              <div key={doc.key} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-700 text-sm">{doc.name}</h4>
                    <Badge variant={
                      doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'danger' : 'warning'
                    }>
                      {doc.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Uploaded file: {doc.key}_preview_doc.pdf</p>
                  
                  {/* Mock file viewer link */}
                  <a href="#" onClick={(e) => { e.preventDefault(); alert(`Viewing file: ${doc.key}_preview_doc.pdf`); }} className="text-brand-purple text-xs font-semibold hover:underline mt-2 inline-block">
                    👁️ View Document Copy
                  </a>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    onClick={() => handleUpdateStatus(doc.key, 'approved')}
                    variant={doc.status === 'approved' ? 'success' : 'outline'}
                    size="sm"
                    className="py-1 px-3 text-xs"
                  >
                    ✓ Approve
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(doc.key, 'rejected')}
                    variant={doc.status === 'rejected' ? 'danger' : 'outline'}
                    size="sm"
                    className="py-1 px-3 text-xs"
                  >
                    ✗ Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs text-right">
            <Button
              onClick={() => { alert('KYC evaluation saved successfully!'); navigate('/admin/delivery-partners'); }}
              variant="primary"
              size="sm"
            >
              💾 Save KYC Decision
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DpDetails;
