import React, { useEffect, useState } from "react";
import {
  fetchCustomers as apiFetchCustomers,
  updateCustomer,
  deleteCustomer,
} from "../../../api/admin.api";
import Table from "../../../components/common/Table";
import Badge from "../../../components/common/Badge";
import Button from "../../../components/common/Button";
import Modal from "../../../components/common/Modal";
import Input from "../../../components/common/Input";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import { Search } from "lucide-react";

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmit, setIsSubmit] = useState(false);

  // Delete Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const fetchCustomers = async (params = {}) => {
    setIsLoading(true);
    try {
      const response = await apiFetchCustomers(params);
      const rawList = response.data.customers || response.data.data?.customers || [];
      const formatted = rawList.map(c => ({
        id: c._id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        status: c.status || 'active'
      }));
      setCustomers(formatted);
    } catch (e) {
      console.error("Failed to load customers", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers({ search: searchQuery });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleOpenEditModal = (customer) => {
    setSelectedCustomer(customer);
    setName(customer.name);
    setEmail(customer.email);
    setPhone(customer.phone);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setIsSubmit(true);

    try {
      await updateCustomer(selectedCustomer.id, { name, email, phone });
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error("Update customer failed", err);
    } finally {
      setIsSubmit(false);
    }
  };

  const handleTriggerDelete = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleteLoading(true);
    try {
      await deleteCustomer(deleteId);
      fetchCustomers();
    } catch (e) {
      console.error("Delete customer failed", e);
    } finally {
      setIsDeleteLoading(false);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const headers = [
    "Name",
    "Phone",
    "Email",
    "Actions",
  ];

  return (
    <div className="space-y-6 text-left page-transition">
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          Customers Directory
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage and edit customer registrations and access status
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs max-w-md">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search by name, phone or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple"
          />
        </div>
      </div>

      <Table
        headers={headers}
        data={customers}
        isLoading={isLoading}
        emptyMessage="No customers found in directory."
        tableClassName="table-fixed"
        renderRow={(customer) => (
          <tr
            key={customer.id}
            className="hover:bg-slate-50/50 transition-colors"
          >
            <td className="px-5 py-4 text-xs font-bold text-slate-800">
              {customer.name}
            </td>
            <td className="px-5 py-4 text-xs text-slate-500">
              {customer.phone}
            </td>
            <td className="px-5 py-4 text-xs text-slate-500">
              {customer.email}
            </td>
            <td className="px-5 py-4 text-xs">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Button
                  onClick={() => handleOpenEditModal(customer)}
                  variant="secondary"
                  size="sm"
                  className="py-1 px-2.5 text-[10px]"
                >
                  ✏️ Edit
                </Button>
                <Button
                  onClick={() => handleTriggerDelete(customer.id)}
                  variant="danger"
                  size="sm"
                  className="py-1 px-2.5 text-[10px]"
                >
                  🗑️ Delete
                </Button>
              </div>
            </td>
          </tr>
        )}
      />

      {/* Edit Customer Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Edit Customer Profile"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <Input
              label="Full Name"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Mobile Number"
              id="phone"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                onClick={() => setIsModalOpen(false)}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmit}
                variant="primary"
                size="sm"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteId(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Customer Profile"
          message="Are you sure you want to delete this customer record? All linked order records history might become unlinked."
          confirmLabel="Delete Customer"
          variant="danger"
          isLoading={isDeleteLoading}
        />
      )}
    </div>
  );
};

export default Customers;
