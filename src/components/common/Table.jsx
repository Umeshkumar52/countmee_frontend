import React from 'react';

export const Table = ({
  headers = [],
  data = [],
  renderRow,
  isLoading = false,
  emptyMessage = 'No records found.',
  tableClassName = ''
}) => {
  return (
    <div className="w-full overflow-hidden bg-white border border-slate-100 rounded-xl shadow-xs">
      <div className="overflow-x-auto">
        <table className={`w-full text-left border-collapse ${tableClassName}`}>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {headers.map((h, i) => (
                <th key={i} className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={headers.length} className="px-5 py-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                    <svg className="animate-spin h-5 w-5 text-brand-purple" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Loading data records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-5 py-8 text-center text-sm text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => renderRow(row, index))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
