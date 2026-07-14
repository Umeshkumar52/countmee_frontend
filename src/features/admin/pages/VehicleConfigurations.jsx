import React, { useState, useEffect } from "react";
import {
  fetchVehicleConfigurations,
  updateVehicleConfiguration,
  deleteVehicleConfiguration,
  createVehicleConfiguration,
} from "../../../api/admin.api";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

export const VehicleConfigurations = () => {
  const [configs, setConfigs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [formData, setFormData] = useState({
    vehicle_type: "Two Wheeler",
    sub_vehicle_type: "",
    is_active: true,
  });

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const response = await fetchVehicleConfigurations();
      if (response.data?.data?.subcategories) {
        setConfigs(response.data.data.subcategories);
      }
    } catch (error) {
      console.error("Failed to load vehicle configurations", error);
      toast.error("Failed to load vehicle configurations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this vehicle type request?")) return;
    try {
      await updateVehicleConfiguration(id, { status: "Approved" });
      loadConfigs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve");
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject this vehicle type request?")) return;
    try {
      await updateVehicleConfiguration(id, { status: "Rejected" });
      loadConfigs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vehicle configuration permanently?"))
      return;
    try {
      await deleteVehicleConfiguration(id);
      loadConfigs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingConfig) {
        await updateVehicleConfiguration(editingConfig._id, formData);
      } else {
        await createVehicleConfiguration(formData);
      }
      setIsModalOpen(false);
      setEditingConfig(null);
      setFormData({
        vehicle_type: "Two Wheeler",
        sub_vehicle_type: "",
        is_active: true,
      });
      loadConfigs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const openAddModal = () => {
    setEditingConfig(null);
    setFormData({
      vehicle_type: "Two Wheeler",
      sub_vehicle_type: "",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (config) => {
    setEditingConfig(config);
    setFormData({
      vehicle_type: config.vehicle_type,
      sub_vehicle_type: config.sub_vehicle_type,
      is_active: config.is_active,
    });
    setIsModalOpen(true);
  };

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const groupedConfigs = configs.reduce((acc, curr) => {
    if (!acc[curr.vehicle_type]) acc[curr.vehicle_type] = [];
    acc[curr.vehicle_type].push(curr);
    return acc;
  }, {});

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Vehicle Configurations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage vehicle types and approve custom requests from Delivery
            Partners.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-brand-purple text-white px-4 py-2 rounded-xl font-medium hover:bg-brand-purple-dark transition-colors"
        >
          <Plus size={18} />
          Add Configuration
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Vehicle Type</th>
                <th className="px-6 py-4">Sub-Vehicle Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Active</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Loading configurations...
                  </td>
                </tr>
              ) : configs.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    No vehicle configurations found.
                  </td>
                </tr>
              ) : (
                Object.entries(groupedConfigs).map(([category, items]) => (
                  <React.Fragment key={category}>
                    {/* Category Header Row */}
                    <tr
                      className="bg-slate-100/50 hover:bg-slate-100 cursor-pointer transition-colors"
                      onClick={() => toggleCategory(category)}
                    >
                      <td
                        colSpan="5"
                        className="px-6 py-3 font-semibold text-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          {expandedCategories[category] ? (
                            <ChevronDown
                              size={18}
                              className="text-brand-purple"
                            />
                          ) : (
                            <ChevronRight
                              size={18}
                              className="text-slate-400"
                            />
                          )}
                          {category}{" "}
                          <span className="text-slate-400 font-normal text-xs ml-2">
                            ({items.length} configurations)
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Subcategory Rows */}
                    {expandedCategories[category] &&
                      items.map((config) => (
                        <tr
                          key={config._id}
                          className={`hover:bg-slate-50 transition-colors ${
                            config.status === "Pending" ? "bg-amber-50/30" : ""
                          }`}
                        >
                          <td className="px-6 py-4 font-medium text-slate-800 pl-12 text-slate-400">
                            ↳
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {config.sub_vehicle_type}
                          </td>
                          <td className="px-6 py-4">
                            {config.status === "Pending" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                Pending
                              </span>
                            )}
                            {config.status === "Approved" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Approved
                              </span>
                            )}
                            {config.status === "Rejected" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Rejected
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {config.is_active ? (
                              <span className="text-green-600 font-medium">
                                Yes
                              </span>
                            ) : (
                              <span className="text-slate-400">No</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {config.status === "Pending" && (
                              <>
                                <button
                                  onClick={() => handleApprove(config._id)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors tooltip"
                                  title="Approve Request"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button
                                  onClick={() => handleReject(config._id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip"
                                  title="Reject Request"
                                >
                                  <XCircle size={18} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => openEditModal(config)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(config._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md page-transition">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {editingConfig ? "Edit Configuration" : "Add Configuration"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Vehicle Type
                </label>
                <select
                  required
                  value={formData.vehicle_type}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicle_type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-purple focus:border-brand-purple bg-slate-50"
                >
                  <option value="By Hand">By Hand</option>
                  <option value="Two Wheeler">Two Wheeler</option>
                  <option value="Three Wheeler">Three Wheeler</option>
                  <option value="Four Wheeler">Four Wheeler</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sub-Vehicle Type
                </label>
                <input
                  type="text"
                  required
                  value={formData.sub_vehicle_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sub_vehicle_type: e.target.value,
                    })
                  }
                  placeholder="e.g. Scooter, EV Bike"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-purple focus:border-brand-purple bg-slate-50"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-brand-purple border-slate-300 rounded focus:ring-brand-purple"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-slate-700"
                >
                  Active (visible to Delivery Partners)
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-brand-purple text-white rounded-xl hover:bg-brand-purple-dark transition-colors font-medium"
                >
                  {editingConfig ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleConfigurations;
