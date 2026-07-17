import React, { useState, useEffect, useCallback } from "react";
import { fetchReportsData } from "../../../api/admin.api";
import { ROLES } from "../../../constants";
import Table from "../../../components/common/Table";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
import Pagination from "../../../components/common/Pagination";
import toast from "react-hot-toast";
import { Landmark } from "lucide-react";

export const Reports = () => {
  const [reportType, setReportType] = useState("order"); // order, user, feedback
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(true);

  // Travel Permit Filters
  const [filterState, setFilterState] = useState("");
  const [filterAipOnly, setFilterAipOnly] = useState(false);

  const INDIAN_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ];

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleFetchReport = useCallback(async () => {
    if (reportType !== "travel_permit" && (!startDate || !endDate)) {
      return;
    }
    setIsLoading(true);
    setReportData([]);

    try {
      const params = {
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
      };
      if (reportType === "travel_permit") {
        if (filterState) params.state = filterState;
        if (filterAipOnly) params.aip_only = filterAipOnly;
      }

      const response = await fetchReportsData(params);
      const data = response.data.data || response.data;
      setReportData(Array.isArray(data) ? data : []);
      setCurrentPage(1); // Reset page on new fetch
    } catch (e) {
      console.error("Failed to generate report", e);
      toast.error("Failed to generate report");
      toast.error("Failed to load report data");
    } finally {
      setIsLoading(false);
    }
  }, [reportType, startDate, endDate, filterState, filterAipOnly]);

  useEffect(() => {
    handleFetchReport();
  }, [handleFetchReport]);

  const handleExportCSV = () => {
    if (reportData.length === 0) return;

    let headers = [];
    let rows = [];
    let filename = "";

    if (reportType === "order") {
      headers = [
        "Order ID",
        "Order Number",
        "Customer",
        "PDC Name",
        "Pickup Location",
        "Drop Location",
        "Order Date",
        "Amount w/o GST",
        "GST Amount",
        "Status",
      ];
      rows = reportData.map((o) => [
        o.id,
        o.order_number,
        `"${o.customer_name || "N/A"}"`,
        `"${o.pdc_name || "N/A"}"`,
        `"${o.pickup_address || "N/A"}"`,
        `"${o.delivery_address || "N/A"}"`,
        o.created_at,
        (o.amountWithoutGst || 0).toFixed(2),
        (o.gstAmount || 0).toFixed(2),
        o.status || "N/A",
      ]);
      filename = `orders_report_${startDate}_to_${endDate}.csv`;
    } else if (reportType === "user") {
      headers = [
        "User ID",
        "User Type",
        "Full Name",
        "Mobile Number",
        "Email Address",
        "Registration Date",
      ];
      rows = reportData.map((u) => [
        u.id,
        u.role ? u.role.toUpperCase() : ROLES.USER.toUpperCase(),
        `"${u.name || "N/A"}"`,
        u.phone || "N/A",
        u.email || "N/A",
        u.registered_at || "N/A",
      ]);
      filename = `users_report_${startDate}_to_${endDate}.csv`;
    } else if (reportType === "feedback") {
      headers = [
        "Feedback ID",
        "From User",
        "User Role",
        "Message / Comment",
        "Star Rating",
        "Date",
      ];
      rows = reportData.map((f) => [
        f.id,
        `"${f.user_name || "N/A"}"`,
        f.role ? f.role.toUpperCase() : "N/A",
        `"${f.comment || "N/A"}"`,
        f.rating,
        f.created_at || "N/A",
      ]);
      filename = `feedback_report_${startDate}_to_${endDate}.csv`;
    } else if (reportType === "travel_permit") {
      headers = [
        "DP Name",
        "DP ID",
        "Mobile",
        "Vehicle",
        "Permit Type",
        "States",
        "Expiry",
      ];
      rows = reportData.map((tp) => [
        `"${tp.dp_name || "N/A"}"`,
        tp.dp_id || "N/A",
        tp.mobile || "N/A",
        `"${tp.vehicle || "N/A"}"`,
        tp.permit_type || "N/A",
        `"${tp.states || "N/A"}"`,
        tp.expiry || "N/A",
      ]);
      filename = `travel_permit_report.csv`;
    }

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

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
    if (reportType === "order") {
      return [
        "Order ID",
        "Pickup Location",
        "Drop Location",
        "Transport Mode",
        "Order Date",
        "Amount w/o GST",
        "GST Amount",
        "Order Status",
      ];
    } else if (reportType === "user") {
      return [
        "User Type",
        "Full Name",
        "Mobile Number",
        "Email Address",
        "Register Date",
      ];
    } else if (reportType === "feedback") {
      return ["From User", "Role", "Comment Message", "Star Rating", "Date"];
    } else if (reportType === "travel_permit") {
      return [
        "DP Name",
        "DP ID",
        "Mobile",
        "Vehicle",
        "Permit Type",
        "States",
        "Expiry",
      ];
    }
    return [];
  };

  const totalItems = reportData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedData = reportData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="space-y-6 text-left page-transition">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
          <Landmark className="w-7 h-7 text-brand-purple" />
          Operational Reports
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Audit platform logs, check date range aggregates, and export
          spreadsheets
        </p>
      </div>

      {/* Date filter form */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1 flex flex-col">
            <label className="text-xs font-bold text-slate-500 mb-1.5">
              Report Category Criteria
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs transition-all outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple cursor-pointer"
            >
              <option value="order">Orders Report</option>
              <option value="user">Users Data Report</option>
              <option value="feedback">Ratings & Feedback Report</option>
              <option value="travel_permit">Travel Permit Report</option>
            </select>
          </div>

          {reportType !== "travel_permit" ? (
            <>
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
            </>
          ) : (
            <>
              <div className="w-full md:w-48 flex flex-col">
                <label className="text-xs font-bold text-slate-500 mb-1.5">
                  State
                </label>
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs transition-all outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple cursor-pointer"
                >
                  <option value="">All States</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full md:w-32 flex items-center mb-2 md:mb-0 bg-slate-100 border border-slate-300 rounded px-3 py-2 cursor-pointer transition-colors hover:bg-slate-200">
                <input
                  type="checkbox"
                  id="aipOnly"
                  checked={filterAipOnly}
                  onChange={(e) => setFilterAipOnly(e.target.checked)}
                  className="mr-2 cursor-pointer"
                />
                <label
                  htmlFor="aipOnly"
                  className="text-sm cursor-pointer select-none"
                >
                  AIP only
                </label>
              </div>
            </>
          )}

          <div className="flex gap-2 w-full md:w-auto">
            {reportData.length > 0 && (
              <Button
                onClick={handleExportCSV}
                variant="success"
                size="sm"
                className="w-full md:w-auto py-2.5 px-6"
              >
                ⬇ Download CSV / Excel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filtered records table */}
      {searched && (
        <div className="space-y-4">
          <div className="flex justify-between items-center pl-1">
            <span className="text-xs font-bold text-slate-500">
              Found {totalItems} records matching criteria
            </span>
          </div>

          <Table
            headers={getTableHeaders()}
            data={paginatedData}
            isLoading={isLoading}
            emptyMessage={`No ${reportType} logs recorded during the selected date range.`}
            renderRow={(item) => {
              if (reportType === "order") {
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-500">
                      {item.orderNumber ||
                        `order_${item.id?.toString().slice(0, 2)}`}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-800 truncate max-w-44">
                      {item.pickup_address}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 truncate max-w-44">
                      {item.delivery_address}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <Badge variant="indigo">
                        {item.transport_mode || "Bike"}
                      </Badge>
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
                    <td className="px-5 py-3.5 text-xs font-bold">
                      <Badge
                        variant={
                          item.status === "completed"
                            ? "success"
                            : item.status === "cancelled"
                              ? "danger"
                              : "indigo"
                        }
                      >
                        {item.status ? item.status.toUpperCase() : "UNKNOWN"}
                      </Badge>
                    </td>
                  </tr>
                );
              } else if (reportType === "user") {
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-xs">
                      <Badge
                        variant={
                          item.role === ROLES.ADMIN
                            ? "danger"
                            : item.role === ROLES.PDC
                              ? "indigo"
                              : "success"
                        }
                      >
                        {item.role
                          ? item.role.toUpperCase()
                          : ROLES.USER.toUpperCase()}
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
                      {item.registered_at || "N/A"}
                    </td>
                  </tr>
                );
              } else if (reportType === "feedback") {
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-800">
                      {item.user_name}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <Badge variant="indigo">
                        {item.role
                          ? item.role.toUpperCase()
                          : ROLES.USER.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 italic font-medium">
                      "{item.comment}"
                    </td>
                    <td className="px-5 py-3.5 text-xs font-extrabold text-amber-500">
                      ⭐ {item.rating} / 5
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {item.created_at || "N/A"}
                    </td>
                  </tr>
                );
              } else if (reportType === "travel_permit") {
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-800">
                      {item.dp_name}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-600">
                      {item.dp_id}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {item.mobile}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-700">
                      {item.vehicle}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">
                      {item.permit_type}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {item.states}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {item.expiry}
                    </td>
                  </tr>
                );
              }
              return null;
            }}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            itemName={`${reportType} logs`}
          />
        </div>
      )}
    </div>
  );
};

export default Reports;
