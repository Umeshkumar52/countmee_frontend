import React, { useEffect, useState } from 'react';
import {
  fetchWallets,
  fetchWalletConfig,
  updateJoiningBonus,
  verifyWalletUser,
  creditIndividual,
  creditMass,
  fetchUserTransactions,
  fetchCustomers,
  fetchWalletConfigHistory,
  fetchMassCreditRecipients
} from '../../../api/admin.api';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import WalletVerificationModal from '../components/WalletVerificationModal';
import Modal from '../../../components/common/Modal';

export const WalletDashboard = () => {
  const [activeTab, setActiveTab] = useState('credit'); // credit, joining, mass
  const [isLoading, setIsLoading] = useState(false);

  // Database / state arrays
  const [customers, setCustomers] = useState([]);
  const [configHistory, setConfigHistory] = useState([]);
  const [massLogs, setMassLogs] = useState([]);
  const [joiningBonus, setJoiningBonus] = useState(0);

  // Filters for customer wallets search
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceRange, setBalanceRange] = useState('All');

  // Add Money / Individual credit state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDesc, setCreditDesc] = useState('');

  // Individual transaction history state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedCustHistory, setSelectedCustHistory] = useState(null);
  const [transactionsList, setTransactionsList] = useState([]);
  const [isTxsLoading, setIsTxsLoading] = useState(false);

  // Joining Bonus update form
  const [bonusInput, setBonusInput] = useState('');

  // Mass credit form state
  const [massAmount, setMassAmount] = useState('');
  const [massDesc, setMassDesc] = useState('');

  // Mass credit recipients state
  const [isRecipientsOpen, setIsRecipientsOpen] = useState(false);
  const [selectedMassLog, setSelectedMassLog] = useState(null);
  const [recipientsList, setRecipientsList] = useState([]);
  const [isRecipientsLoading, setIsRecipientsLoading] = useState(false);

  // 3-step security check modal states
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [verifyActionType, setVerifyActionType] = useState(null); // 'individual', 'joining_bonus', 'mass'

  // Fetch initial configuration & tables data
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const walletsRes = await fetchWallets();
      const data = walletsRes.data.data || walletsRes.data;
      if (data) {
        setJoiningBonus(data.joiningBonus?.value || 0);
        setBonusInput(data.joiningBonus?.value || '');

        // Map customers to the shape expected by UI
        const formattedCustomers = (data.customers || []).map(c => ({
          id: c._id,
          name: c.name,
          phone: c.phone,
          wallet: {
            balance: c.wallet?.balance || 0
          }
        }));
        setCustomers(formattedCustomers);

        // Map config history logs
        const formattedHistory = (data.configHistory || []).map(h => ({
          id: h._id,
          old_value: h.old_value,
          new_value: h.new_value,
          admin_name: h.admin?.name || 'Admin',
          created_at: h.created_at ? new Date(h.created_at).toLocaleString() : 'N/A'
        }));
        setConfigHistory(formattedHistory);

        // Map mass logs
        const formattedMassLogs = (data.massCreditLogs || []).map(l => ({
          id: l._id,
          amount: l.amount,
          user_count: l.user_count,
          description: l.description,
          admin_name: l.admin?.name || 'Admin',
          created_at: l.created_at ? new Date(l.created_at).toLocaleString() : 'N/A'
        }));
        setMassLogs(formattedMassLogs);
      }
    } catch (e) {
      console.error('Failed to load wallet dashboard data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [activeTab]);

  // Handle Search and Filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setBalanceRange('All');
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.phone.includes(searchQuery);
    
    const balance = c.wallet?.balance || 0;
    let matchesRange = true;
    if (balanceRange === '0-100') {
      matchesRange = balance >= 0 && balance <= 100;
    } else if (balanceRange === '101-500') {
      matchesRange = balance >= 101 && balance <= 500;
    } else if (balanceRange === '501-1000') {
      matchesRange = balance >= 501 && balance <= 1000;
    } else if (balanceRange === '1000+') {
      matchesRange = balance > 1000;
    }

    return matchesSearch && matchesRange;
  });

  // Individual Add Money Modal Actions
  const openAddMoney = (customer) => {
    setSelectedCustomer(customer);
    setCreditAmount('');
    setCreditDesc('');
    setIsAddMoneyOpen(true);
  };

  const triggerIndividualCredit = (e) => {
    e.preventDefault();
    if (!creditAmount || parseFloat(creditAmount) <= 0) {
      alert('Please enter a valid credit amount');
      return;
    }
    setVerifyActionType('individual');
    setIsVerifyOpen(true);
  };

  // Individual User Payout History Modal Actions
  const openHistory = async (customer) => {
    setSelectedCustHistory(customer);
    setTransactionsList([]);
    setIsHistoryOpen(true);
    setIsTxsLoading(true);
    try {
      const txs = await fetchUserTransactions(customer.id);
      setTransactionsList(txs.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTxsLoading(false);
    }
  };

  // Joining Bonus update config actions
  const triggerUpdateBonus = (e) => {
    e.preventDefault();
    if (!bonusInput || parseFloat(bonusInput) < 0) {
      alert('Please enter a valid joining bonus amount');
      return;
    }
    setVerifyActionType('joining_bonus');
    setIsVerifyOpen(true);
  };

  // Mass credit actions
  const triggerMassCredit = (e) => {
    e.preventDefault();
    if (!massAmount || parseFloat(massAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!massDesc) {
      alert('Please provide a reason / description');
      return;
    }
    setVerifyActionType('mass');
    setIsVerifyOpen(true);
  };

  // View recipients list of a mass credit log
  const openRecipients = async (log) => {
    setSelectedMassLog(log);
    setRecipientsList([]);
    setIsRecipientsOpen(true);
    setIsRecipientsLoading(true);
    try {
      const res = await fetchMassCreditRecipients(log.id);
      setRecipientsList(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRecipientsLoading(false);
    }
  };

  // Security check verification success handler
  const handleVerificationSuccess = async () => {
    if (verifyActionType === 'individual') {
      try {
        await creditIndividual({
          user_id: selectedCustomer.id,
          amount: parseFloat(creditAmount),
          description: creditDesc
        });
        alert(`Successfully credited ₹${creditAmount} to ${selectedCustomer.name}'s wallet!`);
        setIsAddMoneyOpen(false);
        loadInitialData();
      } catch (err) {
        alert('Transaction failed: ' + err.message);
      }
    } else if (verifyActionType === 'joining_bonus') {
      try {
        await updateJoiningBonus({ amount: parseFloat(bonusInput) });
        alert(`Successfully updated joining bonus to ₹${bonusInput}`);
        loadInitialData();
      } catch (err) {
        alert('Action failed: ' + err.message);
      }
    } else if (verifyActionType === 'mass') {
      try {
        await creditMass({
          amount: parseFloat(massAmount),
          description: massDesc
        });
        alert(`Mass credit operation completed. Credited ₹${massAmount} to all active customers.`);
        setMassAmount('');
        setMassDesc('');
        loadInitialData();
      } catch (err) {
        alert('Mass action failed: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6 text-left page-transition">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Wallet Management</h2>
        <p className="text-xs text-slate-400 mt-1">Adjust credit balances, verify joining config rewards, and execute mass promotional credits</p>
      </div>

      {/* Tabs Pills */}
      <div className="flex gap-2 border-b border-slate-100 pb-2">
        <button
          onClick={() => setActiveTab('credit')}
          className={`px-4 py-2 text-xs font-bold transition-colors rounded-lg cursor-pointer ${
            activeTab === 'credit'
              ? 'bg-brand-purple text-white'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          💳 Credit a Wallet
        </button>
        <button
          onClick={() => setActiveTab('joining')}
          className={`px-4 py-2 text-xs font-bold transition-colors rounded-lg cursor-pointer ${
            activeTab === 'joining'
              ? 'bg-brand-purple text-white'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          🎁 Joining Credit Config
        </button>
        <button
          onClick={() => setActiveTab('mass')}
          className={`px-4 py-2 text-xs font-bold transition-colors rounded-lg cursor-pointer ${
            activeTab === 'mass'
              ? 'bg-brand-purple text-white'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          📢 Mass Credit Promotion
        </button>
      </div>

      {/* Tab: Credit a Wallet */}
      {activeTab === 'credit' && (
        <div className="space-y-6">
          {/* Filters Area */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-end gap-4 shadow-xs">
            <div className="flex-1">
              <Input
                label="Search Customers"
                id="customerSearch"
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="w-full md:w-56 flex flex-col">
              <label className="text-xs font-bold text-slate-500 mb-1.5">Wallet Balance Range</label>
              <select
                value={balanceRange}
                onChange={(e) => setBalanceRange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs transition-all outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple"
              >
                <option value="All">All Balances</option>
                <option value="0-100">Low (₹ 0 - ₹ 100)</option>
                <option value="101-500">Medium (₹ 101 - ₹ 500)</option>
                <option value="501-1000">High (₹ 501 - ₹ 1000)</option>
                <option value="1000+">Super High (₹ 1000+)</option>
              </select>
            </div>

            <Button
              onClick={handleClearFilters}
              variant="secondary"
              size="sm"
              className="py-2.5 px-4 shrink-0 cursor-pointer"
            >
              Clear Filters
            </Button>
          </div>

          {/* Customers Table */}
          <Table
            headers={['Customer ID', 'Full Name', 'Phone Number', 'Wallet Balance', 'Actions']}
            data={filteredCustomers}
            isLoading={isLoading}
            emptyMessage="No customer records match your filters."
            renderRow={(customer) => (
              <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-4 text-xs font-bold text-slate-500">
                  #{customer.id}
                </td>
                <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                  {customer.name}
                </td>
                <td className="px-5 py-4 text-xs text-slate-600">
                  {customer.phone}
                </td>
                <td className="px-5 py-4 text-xs">
                  <Badge variant="success" className="font-extrabold text-[11px] px-3.5 py-1.5 rounded-lg">
                    ₹ {(customer.wallet?.balance || 0).toFixed(2)}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-xs flex gap-2">
                  <Button
                    onClick={() => openAddMoney(customer)}
                    variant="primary"
                    size="xs"
                  >
                    ➕ Add Money
                  </Button>
                  <Button
                    onClick={() => openHistory(customer)}
                    variant="secondary"
                    size="xs"
                  >
                    🕒 View History
                  </Button>
                </td>
              </tr>
            )}
          />
        </div>
      )}

      {/* Tab: Joining Credit Configuration */}
      {activeTab === 'joining' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Update Welcome Bonus</h3>
              <p className="text-xs text-slate-400">
                Configure the promotion bonus amount credited to new users upon registering.
              </p>
              
              <form onSubmit={triggerUpdateBonus} className="space-y-4 pt-2">
                <Input
                  label="Joining Bonus (₹)"
                  id="bonusInput"
                  type="number"
                  placeholder="Enter bonus amount"
                  value={bonusInput}
                  onChange={(e) => setBonusInput(e.target.value)}
                  required
                />
                
                <Button type="submit" variant="primary" size="sm" className="w-full">
                  Save Configuration
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm pl-1">Configuration Logs History</h3>
            
            <Table
              headers={['ID', 'Date & Time', 'Old Value', 'New Value', 'Authorized Admin']}
              data={configHistory}
              isLoading={isLoading}
              emptyMessage="No bonus config modifications logged."
              renderRow={(log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-bold text-slate-400">
                    #{log.id}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    {log.created_at}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 line-through">
                    ₹ {parseFloat(log.old_value || '0').toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-bold text-emerald-600">
                    ₹ {parseFloat(log.new_value || '0').toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">
                    {log.admin_name || 'Admin'}
                  </td>
                </tr>
              )}
            />
          </div>
        </div>
      )}

      {/* Tab: Mass Credit Promotion */}
      {activeTab === 'mass' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Credit All Active Customers</h3>
              <p className="text-xs text-slate-400">
                Instantly top up the wallets of all registered customers with a promotional credit.
              </p>

              <form onSubmit={triggerMassCredit} className="space-y-4 pt-2">
                <Input
                  label="Promotional Amount (₹)"
                  id="massAmount"
                  type="number"
                  placeholder="Enter credit amount"
                  value={massAmount}
                  onChange={(e) => setMassAmount(e.target.value)}
                  required
                />
                
                <Input
                  label="Campaign Description"
                  id="massDesc"
                  placeholder="e.g. Diwali promotional gift credit"
                  value={massDesc}
                  onChange={(e) => setMassDesc(e.target.value)}
                  required
                />

                <Button type="submit" variant="primary" size="sm" className="w-full">
                  💰 Credit All Customers
                </Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm pl-1">Mass Payout Logs</h3>

            <Table
              headers={['Log ID', 'Date & Time', 'Amount', 'Recipients Count', 'Reason', 'Actions']}
              data={massLogs}
              isLoading={isLoading}
              emptyMessage="No mass credit transactions logged."
              renderRow={(log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-bold text-slate-400">
                    #MASS-{log.id}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    {log.created_at}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-bold text-slate-800">
                    ₹ {log.amount.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-indigo-600">
                    {log.user_count} Users
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 truncate max-w-44">
                    {log.description}
                  </td>
                  <td className="px-5 py-3.5 text-xs">
                    <Button
                      onClick={() => openRecipients(log)}
                      variant="secondary"
                      size="xs"
                    >
                      🔍 View Recipients
                    </Button>
                  </td>
                </tr>
              )}
            />
          </div>
        </div>
      )}

      {/* Add Money Modal (Individual Customer) */}
      {isAddMoneyOpen && selectedCustomer && (
        <Modal
          isOpen={isAddMoneyOpen}
          onClose={() => setIsAddMoneyOpen(false)}
          title={`Credit Wallet: ${selectedCustomer.name}`}
        >
          <form onSubmit={triggerIndividualCredit} className="space-y-4 text-left">
            <div className="bg-slate-50 p-4 rounded-xl space-y-1">
              <p className="text-xs text-slate-500 font-semibold">User Details</p>
              <p className="text-sm font-bold text-slate-800">{selectedCustomer.name}</p>
              <p className="text-xs text-slate-400">Phone: {selectedCustomer.phone}</p>
              <p className="text-xs text-slate-600 font-medium mt-1">Current Balance: ₹ {(selectedCustomer.wallet?.balance || 0).toFixed(2)}</p>
            </div>

            <Input
              label="Add Balance Amount (₹)"
              id="creditAmount"
              type="number"
              placeholder="Enter amount to add"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              required
            />

            <Input
              label="Credit Description"
              id="creditDesc"
              placeholder="Reason for balance adjustments"
              value={creditDesc}
              onChange={(e) => setCreditDesc(e.target.value)}
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setIsAddMoneyOpen(false)} variant="secondary" size="sm">
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Payout
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Customer Wallet Transactions History Modal */}
      {isHistoryOpen && selectedCustHistory && (
        <Modal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          title={`Wallet Ledger: ${selectedCustHistory.name}`}
        >
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1 text-left">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
              <div>
                <p className="text-xs font-bold text-slate-800">{selectedCustHistory.name}</p>
                <p className="text-[10px] text-slate-400">Phone: {selectedCustHistory.phone}</p>
              </div>
              <Badge variant="success" className="font-extrabold text-[12px] px-3.5 py-1.5 rounded-lg">
                Current: ₹ {(selectedCustHistory.wallet?.balance || 0).toFixed(2)}
              </Badge>
            </div>

            <Table
              headers={['TX ID', 'Date & Time', 'Amount', 'Reason']}
              data={transactionsList}
              isLoading={isTxsLoading}
              emptyMessage="No transactions found in this wallet ledger."
              renderRow={(tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50">
                  <td className="p-3 text-xs font-bold text-slate-400">
                    #TX-{tx.id}
                  </td>
                  <td className="p-3 text-xs text-slate-500">
                    {tx.created_at}
                  </td>
                  <td className="p-3 text-xs font-extrabold text-emerald-600">
                    + ₹ {tx.amount.toFixed(2)}
                  </td>
                  <td className="p-3 text-xs text-slate-700 font-semibold max-w-48 truncate">
                    {tx.description}
                  </td>
                </tr>
              )}
            />

            <div className="flex justify-end pt-2">
              <Button onClick={() => setIsHistoryOpen(false)} variant="secondary" size="sm">
                Close Ledger
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Mass Credit Recipients List Modal */}
      {isRecipientsOpen && selectedMassLog && (
        <Modal
          isOpen={isRecipientsOpen}
          onClose={() => setIsRecipientsOpen(false)}
          title={`Mass Credit Recipients Log: #MASS-${selectedMassLog.id}`}
        >
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1 text-left">
            <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-1">
              <p><span className="font-bold text-slate-700">Campaign Reason:</span> {selectedMassLog.description}</p>
              <p><span className="font-bold text-slate-700">Amount Per User:</span> ₹ {selectedMassLog.amount.toFixed(2)}</p>
              <p><span className="font-bold text-slate-700">Total Users Credited:</span> {selectedMassLog.user_count} Customers</p>
              <p><span className="font-bold text-slate-700">Executed On:</span> {selectedMassLog.created_at}</p>
            </div>

            <Table
              headers={['Recipient Name', 'Mobile Number', 'Credited Amount', 'Timestamp']}
              data={recipientsList}
              isLoading={isRecipientsLoading}
              emptyMessage="No recipient details found for this campaign."
              renderRow={(recipient) => (
                <tr key={recipient.id || recipient.phone} className="hover:bg-slate-50/50">
                  <td className="p-3 text-xs font-semibold text-slate-800">
                    {recipient.name}
                  </td>
                  <td className="p-3 text-xs text-slate-600">
                    {recipient.phone}
                  </td>
                  <td className="p-3 text-xs font-bold text-slate-800">
                    ₹ {recipient.amount.toFixed(2)}
                  </td>
                  <td className="p-3 text-xs text-slate-400">
                    {recipient.created_at}
                  </td>
                </tr>
              )}
            />

            <div className="flex justify-end pt-2">
              <Button onClick={() => setIsRecipientsOpen(false)} variant="secondary" size="sm">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3-Step Verification Security Modal */}
      {isVerifyOpen && (
        <WalletVerificationModal
          isOpen={isVerifyOpen}
          onClose={() => setIsVerifyOpen(false)}
          onVerificationSuccess={handleVerificationSuccess}
          actionLabel={
            verifyActionType === 'individual'
              ? `Credit ₹${creditAmount} to ${selectedCustomer?.name}`
              : verifyActionType === 'joining_bonus'
              ? `Update Sign-up Bonus to ₹${bonusInput}`
              : `Mass credit ₹${massAmount} to all customers`
          }
        />
      )}
    </div>
  );
};

export default WalletDashboard;
