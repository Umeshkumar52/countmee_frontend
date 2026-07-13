import React, { useEffect, useState } from 'react';
import { Clock, History, Landmark, Info, Wallet, Search, ExternalLink, HourglassIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchPendingPayments, fetchPastPayments, settlePayments, fetchAdminWaitingCharges, fetchLatePaidWaitingCharges } from '../../../api/admin.api';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import Modal from '../../../components/common/Modal';
import Input from '../../../components/common/Input';
import toast from 'react-hot-toast';

export const FinanceOverview = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('pending'); // pending, past, waiting
  const [waitingSubTab, setWaitingSubTab] = useState('pending'); // pending, settled, late
  const [financeType, setFinanceType] = useState('DP'); // DP, PDC
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [pendingRecords, setPendingRecords] = useState([]);
  const [pastRecords, setPastRecords] = useState([]);
  const [waitingRecords, setWaitingRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsOrders, setDetailsOrders] = useState([]);
  const [isSettling, setIsSettling] = useState(false);
  
  // Hovered bank info tooltip state
  const [hoveredBankId, setHoveredBankId] = useState(null);

  const handleFetchPending = async () => {
    setIsLoading(true);
    setPendingRecords([]);
    try {
      const response = await fetchPendingPayments({
        type: financeType,
        startdate: startDate,
        enddate: endDate
      });
      setPendingRecords(response.data.data || response.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load pending payments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchPast = async () => {
    setIsLoading(true);
    setPastRecords([]);
    try {
      const response = await fetchPastPayments();
      setPastRecords(response.data.data || response.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchWaiting = async () => {
    setIsLoading(true);
    setWaitingRecords([]);
    try {
      let response;
      if (waitingSubTab === 'late') {
        response = await fetchLatePaidWaitingCharges();
      } else {
        response = await fetchAdminWaitingCharges({ status: waitingSubTab });
      }
      setWaitingRecords(response.data.data || response.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load waiting charges');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'past') {
      handleFetchPast();
    } else if (activeView === 'waiting') {
      handleFetchWaiting();
    } else {
      handleFetchPending();
    }
  }, [activeView, financeType, waitingSubTab]);

  const [settleType, setSettleType] = useState('both'); // base, waiting, both

  const triggerSettle = (group) => {
    setSelectedGroup(group);
    setSettleType('base'); // Restrict to base only for bulk
    setIsConfirmOpen(true);
  };

  const confirmSettle = async () => {
    if (!selectedGroup) return;
    setIsSettling(true);
    try {
      let finalAmount = selectedGroup.amount_to_pay;
      if (financeType === 'DP' && selectedGroup.orders) {
        const baseToPay = selectedGroup.orders.filter(o => !o.base_settled).reduce((acc, o) => acc + (o.amount || 0), 0);
        const waitingToPay = selectedGroup.orders.filter(o => !o.waiting_charge_settled).reduce((acc, o) => acc + (o.waiting_charge || 0), 0);
        if (settleType === 'base') finalAmount = baseToPay;
        else if (settleType === 'waiting') finalAmount = waitingToPay;
      }

      await settlePayments({
        ids: selectedGroup.payout_ids,
        payable: selectedGroup.dp_auth_id || selectedGroup.pdc_auth_id,
        settlement_amount: finalAmount,
        settle_type: settleType
      });
      toast.success('Account settled successfully!');
      setIsConfirmOpen(false);
      handleFetchPending();
    } catch (e) {
      console.error(e);
      toast.error('Settlement failed: ' + e.message);
    } finally {
      setIsSettling(false);
    }
  };

  const showDetails = (group) => {
    navigate(`/admin/finance/partner/${group.dp_auth_id || group.pdc_auth_id}`, { state: { groupData: group, financeType } });
  };

  const pendingHeaders = financeType === 'DP'
    ? ['Pilot ID', 'Pilot Name', 'Total Orders', 'Sum to Pay', 'Bank Details', 'Actions']
    : ['PDC ID', 'Center Name', 'Total Orders', 'Sum to Pay', 'Bank Details', 'Actions'];
  const pastHeaders = ['Settlement ID', 'Recipient Name', 'Role', 'Payment Type', 'Amount Paid', 'Orders Settled', 'Date'];

  return (
    <div className="space-y-6 text-left page-transition">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Finance Settlement</h2>
          <p className="text-xs text-slate-400 mt-1">Verify earnings accounts, aggregate payouts, and settle partner transactions</p>
        </div>
      </div>

      {/* Main View Toggle Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-2">
        <button
          onClick={() => setActiveView('pending')}
          className={`px-4 py-2 text-xs font-bold transition-colors rounded-lg cursor-pointer flex items-center gap-2 ${
            activeView === 'pending'
              ? 'bg-brand-purple text-white'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" /> Pending Payments
        </button>
        <button
          onClick={() => setActiveView('past')}
          className={`px-4 py-2 text-xs font-bold transition-colors rounded-lg cursor-pointer flex items-center gap-2 ${
            activeView === 'past'
              ? 'bg-brand-purple text-white'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" /> Past Payouts History
        </button>
        <button
          onClick={() => setActiveView('waiting')}
          className={`px-4 py-2 text-xs font-bold transition-colors rounded-lg cursor-pointer flex items-center gap-2 ${
            activeView === 'waiting'
              ? 'bg-amber-500 text-white'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <HourglassIcon className="w-4 h-4" /> Waiting Charges
        </button>
      </div>

      {activeView === 'pending' ? (
        <div className="space-y-6">
          {/* Query Filter Area */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-end gap-4 shadow-xs">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 mb-1.5">Payout Partner Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFinanceType('DP')}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors border cursor-pointer ${
                    financeType === 'DP'
                      ? 'bg-brand-purple border-brand-purple text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Delivery Partner (Pilot)
                </button>
                <button
                  onClick={() => setFinanceType('PDC')}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors border cursor-pointer ${
                    financeType === 'PDC'
                      ? 'bg-brand-purple border-brand-purple text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  PDC Store Center
                </button>
              </div>
            </div>

            <div className="w-full md:w-48">
              <Input
                label="Start Date"
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="w-full md:w-48">
              <Input
                label="End Date"
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <Button
              onClick={handleFetchPending}
              isLoading={isLoading}
              variant="primary"
              size="sm"
              className="py-2.5 px-5 shrink-0"
            >
              Get Pending Payments
            </Button>
          </div>

          {/* Pending Table */}
          <Table
            headers={pendingHeaders}
            data={pendingRecords}
            isLoading={isLoading}
            emptyMessage={`No pending ${financeType === 'DP' ? 'Delivery Partner' : 'PDC'} payouts found in this date range.`}
            renderRow={(group) => {
              const id = group.dp_auth_id || group.pdc_auth_id;
              const isHovered = hoveredBankId === id;
              return (
                <tr key={id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4 text-xs font-bold text-slate-500">
                    #{id}
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                    {group.name}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600 font-bold">
                    {group.total_orders} Orders
                  </td>
                  <td className="px-5 py-4 text-xs font-extrabold text-slate-900">
                    ₹ {group.amount_to_pay.toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600 relative">
                    <div
                      onMouseEnter={() => setHoveredBankId(id)}
                      onMouseLeave={() => setHoveredBankId(null)}
                      className="inline-flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 py-1 px-2.5 rounded-lg border border-slate-200 transition-colors"
                    >
                      <Landmark className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-500 font-semibold text-[10px]">Bank Info</span>
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                    </div>

                    {isHovered && (
                      <div className="absolute z-50 bottom-full mb-2 left-5 bg-slate-800 text-white p-3 rounded-xl shadow-lg border border-slate-700 min-w-56 text-[10px] space-y-1 page-transition">
                        {financeType === 'DP' ? (
                          <>
                            <p className="font-bold border-b border-slate-700 pb-1 mb-1 text-slate-300">Bank Details</p>
                            <p><span className="text-slate-400">Bank Name:</span> {group.bank_name}</p>
                            <p><span className="text-slate-400">Account No:</span> {group.bank_acc_number}</p>
                            <p><span className="text-slate-400">IFSC Code:</span> {group.bank_ifsc}</p>
                          </>
                        ) : (
                          <>
                            <p className="font-bold border-b border-slate-700 pb-1 mb-1 text-slate-300">Bank Details</p>
                            <p><span className="text-slate-400">Account No:</span> {group.account_no}</p>
                            <p><span className="text-slate-400">IFSC Code:</span> {group.ifsc}</p>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs flex gap-2">
                    <Button
                      onClick={() => triggerSettle(group)}
                      variant="success"
                      size="xs"
                      className="flex items-center gap-1"
                    >
                      <Wallet className="w-3.5 h-3.5" /> Settle Payout
                    </Button>
                    <Button
                      onClick={() => showDetails(group)}
                      variant="secondary"
                      size="xs"
                      className="flex items-center gap-1"
                    >
                      <Search className="w-3.5 h-3.5" /> View Orders
                    </Button>
                  </td>
                </tr>
              );
            }}
          />
        </div>
      ) : activeView === 'waiting' ? (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4 shadow-xs">
            <div className="flex gap-2 w-full overflow-x-auto pb-2 sm:pb-0">
              <button
                onClick={() => setWaitingSubTab('pending')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors border whitespace-nowrap cursor-pointer ${
                  waitingSubTab === 'pending'
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Pending (Last 4 Months)
              </button>
              <button
                onClick={() => setWaitingSubTab('settled')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors border whitespace-nowrap cursor-pointer ${
                  waitingSubTab === 'settled'
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Settled (Last 4 Months)
              </button>
              <button
                onClick={() => setWaitingSubTab('late')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors border whitespace-nowrap cursor-pointer ${
                  waitingSubTab === 'late'
                    ? 'bg-brand-purple border-brand-purple text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Late Paid Revenue (Last 30 Days)
              </button>
            </div>
            
            <Button
              onClick={handleFetchWaiting}
              isLoading={isLoading}
              variant="primary"
              size="sm"
              className="py-2.5 px-5 shrink-0 sm:ml-auto"
            >
              Refresh Data
            </Button>
          </div>

          <Table
            headers={waitingSubTab === 'late' ? ['Order ID', 'Payment Status', 'Paid Date', 'Total Wait Charge'] : pendingHeaders}
            data={waitingRecords}
            isLoading={isLoading}
            emptyMessage={waitingSubTab === 'late' ? "No late paid waiting charges in the last 30 days." : `No ${waitingSubTab} waiting charges found in the last 4 months.`}
            renderRow={(item) => {
              if (waitingSubTab === 'late') {
                return (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 text-xs font-bold text-slate-500">#{item.order_id?._id}</td>
                    <td className="px-5 py-4 text-xs"><Badge variant="success">Paid ({item.payment_method})</Badge></td>
                    <td className="px-5 py-4 text-xs text-slate-600">{new Date(item.paid_at).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-xs font-extrabold text-slate-900">₹ {(item.total_waiting_charge || 0).toFixed(2)}</td>
                  </tr>
                );
              }

              // Standard Group Row for Pending/Settled
              const id = item.dp_auth_id || item.pdc_auth_id;
              return (
                <tr key={id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4 text-xs font-bold text-slate-500">#{id}</td>
                  <td className="px-5 py-4 text-xs font-semibold text-slate-800">{item.name}</td>
                  <td className="px-5 py-4 text-xs text-slate-600 font-bold">{item.total_orders} Orders</td>
                  <td className="px-5 py-4 text-xs font-extrabold text-slate-900">₹ {(item.amount_to_pay || 0).toFixed(2)}</td>
                  <td className="px-5 py-4 text-xs text-slate-600">Bank Info Available</td>
                  <td className="px-5 py-4 text-xs flex gap-2">
                    <Button onClick={() => showDetails(item)} variant="secondary" size="xs">
                      View Orders
                    </Button>
                  </td>
                </tr>
              );
            }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Past Settlements History Table */}
          <Table
            headers={pastHeaders}
            data={pastRecords}
            isLoading={isLoading}
            emptyMessage="No settled payouts history found."
            renderRow={(item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-4 text-xs font-bold text-slate-500">
                  #SETTLE-{item.id}
                </td>
                <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                  {item.user_name}
                </td>
                <td className="px-5 py-4 text-xs">
                  <Badge variant={item.user_type === 'DP' ? 'success' : 'indigo'}>
                    {item.user_type === 'DP' ? 'Pilot (DP)' : 'PDC Center'}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-xs">
                  {item.settle_type === 'waiting' ? (
                    <Badge variant="warning">Wait Charge</Badge>
                  ) : item.settle_type === 'both' ? (
                    <Badge variant="indigo">Base + Wait</Badge>
                  ) : (
                    <Badge variant="success">Base Price</Badge>
                  )}
                </td>
                <td className="px-5 py-4 text-xs font-bold text-slate-700">
                  ₹ {item.settled_amount.toFixed(2)}
                </td>
                <td className="px-5 py-4 text-xs">
                  <span className="text-slate-500 font-medium">
                    {item.order_id?.length || 0} Orders Settled
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500">
                  {item.created_at}
                </td>
              </tr>
            )}
          />
        </div>
      )}

      {/* Settle Payout Confirmation Warning Modal */}
      {isConfirmOpen && selectedGroup && (
        <ConfirmationModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={confirmSettle}
          title="Confirm Base Earnings Settlement"
          message={`Are you sure you want to settle the base delivery earnings for ${selectedGroup.name}? Waiting charges must be settled individually from the View Orders page.`}
          confirmLabel="Settle Base Amount"
          variant="warning"
          isLoading={isSettling}
        >
          {financeType === 'DP' ? (
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded transition-colors bg-white border border-slate-200">
                <input 
                  type="radio" 
                  name="settleType" 
                  value="base"
                  checked={true}
                  readOnly
                  className="accent-brand-purple"
                />
                <span className="text-xs font-semibold text-slate-600 flex-1">Base Earnings Only</span>
                <span className="text-xs font-bold text-slate-800">
                  ₹{selectedGroup.orders?.filter(o => !o.base_settled).reduce((acc, o) => acc + (o.amount || 0), 0).toFixed(2) || '0.00'}
                </span>
              </label>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-center">
              <span className="text-sm font-bold text-slate-700">Total Settlement: ₹{(selectedGroup.amount_to_pay || 0).toFixed(2)}</span>
            </div>
          )}
        </ConfirmationModal>
      )}

      {/* Orders Breakdowns Details Modal (REMOVED - Replaced by PartnerOrderBreakdown page) */}
    </div>
  );
};

export default FinanceOverview;
