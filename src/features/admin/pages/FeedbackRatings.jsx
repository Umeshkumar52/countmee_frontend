import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { MessageSquareWarning } from "lucide-react";
import { ROLES } from "../../../constants";
import { fetchRatings } from "../../../api/admin.api";
import Table from "../../../components/common/Table";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Pagination from "../../../components/common/Pagination";

export const FeedbackRatings = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [activeTab, setActiveTab] = useState(ROLES.USER);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFeedbacks, setTotalFeedbacks] = useState(0);

  useEffect(() => {
    const loadFeedbacks = async () => {
      setIsLoading(true);
      try {
        const response = await fetchRatings(activeTab, currentPage, 10);
        // The backend returns: { ratings, total, page, totalPages } wrapped in success structure
        const resData = response.data.data || response.data;
        const rawList = resData.ratings || [];

        const formatted = rawList.map((r) => {
          let name = "System";
          let role = activeTab; // We know it belongs to the active tab

          if (r.from_customer && activeTab === ROLES.USER) {
            name = r.from_customer.name || "Customer";
          } else if (r.from_dp && activeTab === ROLES.DP) {
            name = r.from_dp.name || "Delivery Partner";
          } else if (r.from_pdc && activeTab === ROLES.PDC) {
            name = r.from_pdc.name || "PDC Hub";
          }

          return {
            id: r._id,
            user_name: name,
            role: role,
            rating: r.stars || 5,
            comment: r.message || "",
          };
        });

        setFeedbacks(formatted);
        setTotalPages(resData.totalPages || 1);
        setTotalFeedbacks(resData.total || 0);
      } catch (e) {
        console.error("Failed to load feedbacks", e);
        toast.error("Failed to load feedbacks");
      } finally {
        setIsLoading(false);
      }
    };
    loadFeedbacks();
  }, [activeTab, currentPage]);

  const renderStars = (score) => {
    return (
      <span className="text-amber-500 font-bold tracking-wider">
        {"★".repeat(score)}
        {"☆".repeat(5 - score)}
      </span>
    );
  };

  const headers = ["Submitted By", "User Role", "Rating Score", "Comments"];

  const tabs = [
    { name: "Customer Ratings", value: ROLES.USER },
    { name: "DP Ratings", value: ROLES.DP },
    { name: "PDC Ratings", value: ROLES.PDC },
  ];

  return (
    <div className="space-y-6 text-left page-transition">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
          <MessageSquareWarning className="w-7 h-7 text-brand-purple" />
          Feedbacks & Ratings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Review score ratings and feedback remarks submitted by clients and
          partners
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              setCurrentPage(1);
            }}
            className={`px-4 py-2.5 text-xs font-bold transition-colors rounded-lg cursor-pointer ${
              activeTab === tab.value
                ? "bg-brand-purple text-white"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <Table
        headers={headers}
        data={feedbacks}
        isLoading={isLoading}
        emptyMessage="No rating logs recorded yet."
        renderRow={(fb) => (
          <tr key={fb.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-5 py-4 text-xs font-bold text-slate-800">
              {fb.user_name}
            </td>
            <td className="px-5 py-4 text-xs">
              <Badge variant={fb.role === ROLES.USER ? "info" : "primary"}>
                {fb.role}
              </Badge>
            </td>
            <td className="px-5 py-4 text-sm">{renderStars(fb.rating)}</td>
            <td className="px-5 py-4 text-xs text-slate-600 font-medium italic">
              "{fb.comment || "No comments left."}"
            </td>
          </tr>
        )}
      />

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalFeedbacks}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
        itemName="logs"
      />
    </div>
  );
};

export default FeedbackRatings;
