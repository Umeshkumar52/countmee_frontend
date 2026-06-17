import React, { useEffect, useState } from 'react';
import { fetchPdcEarnings } from '../../../api/pdc.api';
import Table from '../../../components/common/Table';

export const PdcEarning = () => {
  const [transactions, setTransactions] = useState([]);
  const [totalEarning, setTotalEarning] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEarnings = async () => {
    setIsLoading(true);
    try {
      const response = await fetchPdcEarnings();
      setTransactions(response.data.transactions || []);
      setTotalEarning(response.data.total || 0);
    } catch (e) {
      console.error('Failed to load earnings', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const headers = ['Transaction ID', 'Date & Time', 'Description', 'Amount'];

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left page-transition">
      {/* Total Earnings Balance Card */}
      <div className="bg-gradient-to-br from-[#9073be] to-[#522f89] rounded-2xl shadow-lg p-6 md:p-8 text-white flex justify-between items-center relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 transform origin-top"></div>
        
        <div>
          <span className="text-xs text-white/70 uppercase tracking-wider font-semibold">Total Accumulative Earnings</span>
          <h2 className="text-3xl md:text-4xl font-extrabold font-display mt-2">₹ {totalEarning.toFixed(2)}</h2>
          <p className="text-[10px] text-white/50 mt-1">Payout settlements are automatically credited to your wallet</p>
        </div>
        <div className="text-4xl">
          🪙
        </div>
      </div>

      {/* Ledger History List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider pl-1">Earnings Transactions</h3>
        
        <Table
          headers={headers}
          data={transactions}
          isLoading={isLoading}
          emptyMessage="No payout transactions credited yet."
          renderRow={(tx) => (
            <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-5 py-4 text-xs font-bold text-slate-400">
                #TX-{tx.id}
              </td>
              <td className="px-5 py-4 text-xs text-slate-600">
                {tx.created_at}
              </td>
              <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                {tx.description}
              </td>
              <td className="px-5 py-4 text-xs font-bold text-emerald-600">
                + ₹{tx.amount.toFixed(2)}
              </td>
            </tr>
          )}
        />
      </div>

    </div>
  );
};

export default PdcEarning;
