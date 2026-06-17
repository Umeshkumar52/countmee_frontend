import React, { useState } from 'react';
import { fetchReportsData } from '../../../api/admin.api';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';

export const Reports = () => {
  const [reportType, setReportType] = useState('order'); // order, user, feedback
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleFetchReport = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert('Please select start and end dates');
      return;
    }
    setIsLoading(true);
    setSearched(true);
    setReportData([]);

    try {
      const response = await fetchReportsData({
        deliveryPartner: reportType,
        startdate: startDate,
        enddate: endDate
      });
      const data = response.data.data || response.data;
      setReportData(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to generate report', e);
      alert('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) return;

    let headers = [];
    let rows = [];
    let filename = '';

    if (reportType === 'order') {
      headers = [
        'Order ID', 'Order Number', 'Customer', 'PDC Name', 'Pickup Location', 
        'Drop Location', 'Order Date', 'Amount w/o GST', 'GST Amount', 'Payout Cost Incurred', 'Status'
      ];
      rows = reportData.map(o => [
        o.id,
        o.order_number,
        `"${o.customer_name || 'N/A'}"`,
        `"${o.pdc_name || 'N/A'}"`,
        `"${o.pickup_address || 'N/A'}"`,
        `"${o.delivery_address || 'N/A'}"`,
        o.created_at,
        (o.amountWithoutGst || 0).toFixed(2),
        (o.gstAmount || 0).toFixed(2),
        (o.payoutCost || 0).toFixed(2),
        o.status
      ]);
      filename = `orders_report_${startDate}_to_${endDate}.csv`;
    } else if (reportType === 'user') {
      headers = ['User ID', 'User Type', 'Full Name', 'Mobile Number', 'Email Address', 'Registration Date'];
      rows = reportData.map(u => [
        u.id,
        u.role ? u.role.toUpperCase() : 'CUSTOMER',
        `"${u.name || 'N/A'}"`,
        u.phone || 'N/A',
        u.email || 'N/A',
        u.registered_at || 'N/A'
      ]);
      filename = `users_report_${startDate}_to_${endDate}.csv`;
    } else if (reportType === 'feedback') {
      headers = ['Feedback ID', 'From User', 'User Role', 'Message / Comment', 'Star Rating', 'Date'];
      rows = reportData.map(f => [
        f.id,
        `"${f.user_name || 'N/A'}"`,
        f.role ? f.role.toUpperCase() : 'N/A',
        `"${f.comment || 'N/A'}"`,
        f.rating,
        f.created_at || 'N/A'
      ]);
      filename = `feedback_report_${startDate}_to_${endDate}.csv`;
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Define headers for the UI tables based on type
  const getTableHeaders = () => {
    if (reportType === 'order') {
      return [
        'Order ID', 'Pickup Location', 'Drop Location', 'Transport Mode', 
        'Order Date', 'Amount w/o GST', 'GST Amount', 'Payout Cost Incurred'
      ];
    } else if (reportType === 'user') {
      return ['User ID', 'User Type', 'Full Name', 'Mobile Number', 'Email Address', 'Register Date'];
    } else if (reportType === 'feedback') {
      return ['Feedback ID', 'From User', 'Role', 'Comment Message', 'Star Rating', 'Date'];
    }
    return [];
  };

  return (
    <div className="space-y-6 text-left page-transition">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Operational Reports</h2>
        <p className="text-xs text-slate-400 mt-1">Audit platform logs, check date range aggregates, and export spreadsheets</p>
      </div>

      {/* Date filter form */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
        <form onSubmit={handleFetchReport} className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1 flex flex-col">
            <label className="text-xs font-bold text-slate-500 mb-1.5">Report Category Criteria</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs transition-all outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple cursor-pointer"
            >
              <option value="order">Orders Report</option>
              <option value="user">Users Data Report</option>
              <option value="feedback">Ratings & Feedback Report</option>
            </select>
          </div>

          <div className="w-full md:w-48">
            <Input
              label="From Date"
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="w-full md:w-48">
            <Input
              label="To Date"
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Button type="submit" isLoading={isLoading} variant="primary" size="sm" className="w-full md:w-auto py-2.5 px-6">
              Generate Report
            </Button>
            {searched && reportData.length > 0 && (
              <Button onClick={handleExportCSV} variant="success" size="sm" className="w-full md:w-auto py-2.5 px-6">
                📥 Download CSV / Excel
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Filtered records table */}
      {searched && (
        <div className="space-y-4">
          <div className="flex justify-between items-center pl-1">
            <span className="text-xs font-bold text-slate-500">
              Found {reportData.length} records matching criteria
            </span>
          </div>

          <Table
            headers={getTableHeaders()}
            data={reportData}
            isLoading={isLoading}
            emptyMessage={`No ${reportType} logs recorded during the selected date range.`}
            renderRow={(item) => {
              if (reportType === 'order') {
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-500">
                      #{item.order_number}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-800 truncate max-w-44">
                      {item.pickup_address}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 truncate max-w-44">
                      {item.delivery_address}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <Badge variant="indigo">{item.transport_mode || 'Bike'}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {item.created_at}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-700">
                      ₹ {(item.amountWithoutGst || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-500">
                      ₹ {(item.gstAmount || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-extrabold text-red-600">
                      ₹ {(item.payoutCost || 0).toFixed(2)}
                    </td>
                  </tr>
                );
              } else if (reportType === 'user') {
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-400">
                      #{item.id}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <Badge variant={item.role === 'admin' ? 'danger' : item.role === 'pdc' ? 'indigo' : 'success'}>
                        {item.role ? item.role.toUpperCase() : 'CUSTOMER'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-800">
                      {item.name}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {item.phone}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {item.email}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {item.registered_at || 'N/A'}
                    </td>
                  </tr>
                );
              } else if (reportType === 'feedback') {
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-400">
                      #{item.id}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-800">
                      {item.user_name}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <Badge variant="indigo">{item.role ? item.role.toUpperCase() : 'CUSTOMER'}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 italic font-medium">
                      "{item.comment}"
                    </td>
                    <td className="px-5 py-3.5 text-xs font-extrabold text-amber-500">
                      ⭐ {item.rating} / 5
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {item.created_at || 'N/A'}
                    </td>
                  </tr>
                );
              }
              return null;
            }}
          />
        </div>
      )}

    </div>
  );
};

export default Reports;
