import { useEffect, useState } from "react";
import {
  fetchBroadcast,
  updateMinBroadcastDistance,
} from "../../../api/admin.api";
import { ROLES } from "../../../constants";
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
import toast from 'react-hot-toast';

export const Broadcast = () => {
  const [distancesByRole, setDistancesByRole] = useState({});
  const [selectedRole, setSelectedRole] = useState(ROLES.DP);
  const [minDistance, setMinDistance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingDist, setIsUpdatingDist] = useState(false);

  const fetchBroadcastData = async () => {
    setIsLoading(true);
    try {
      const response = await fetchBroadcast();
      const data = response.data.data || response.data;
      if (data.distancesByRole) {
        setDistancesByRole(data.distancesByRole);
        // Set the input field to the currently selected role's distance
        setMinDistance(data.distancesByRole[selectedRole] || 3);
      }
    } catch (e) {
      console.error("Failed to load broadcasts", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcastData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setSelectedRole(newRole);
    setMinDistance(distancesByRole[newRole] || 3);
  };

  const handleUpdateMinDist = async (e) => {
    e.preventDefault();
    setIsUpdatingDist(true);
    try {
      await updateMinBroadcastDistance({
        role: selectedRole,
        distance: parseFloat(minDistance),
      });
      toast.success(`Maximum broadcast range for ${selectedRole} updated successfully!`);
      fetchBroadcastData();
    } catch (e) {
      console.error("Failed to update distance rule", e);
    } finally {
      setIsUpdatingDist(false);
    }
  };

  return (
    <div className="space-y-6 text-left page-transition max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          Role-Based Broadcast Configurations
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage maximum parcel assignment search radii for different user roles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-4">
            Coverage Parameters
          </h3>
          <form onSubmit={handleUpdateMinDist} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 pl-1">
                Broadcast Type (User Role)
              </label>
              <select
                value={selectedRole}
                onChange={handleRoleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm transition-all outline-none focus:ring-4 focus:ring-brand-purple/10 focus:border-brand-purple focus:bg-white"
                required
              >
                {Object.entries(ROLES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            
            <Input
              label="Maximum Broadcast Range (km)"
              id="minDistance"
              type="number"
              min="0"
              step="0.1"
              value={minDistance}
              onChange={(e) => setMinDistance(e.target.value)}
              required
            />

            <Button
              type="submit"
              isLoading={isUpdatingDist}
              variant="primary"
              size="sm"
              className="w-full sm:w-auto mt-4"
            >
              Save Parameter
            </Button>
          </form>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-4">
            Currently Configured Rules
          </h3>
          {isLoading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : Object.keys(distancesByRole).length === 0 ? (
            <p className="text-sm text-slate-500 italic">No role distances configured yet. Using system default (3 km).</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(distancesByRole).map(([role, distance]) => (
                <div key={role} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center">
                      <span className="text-brand-purple font-bold text-xs">{role.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{role}</p>
                      <p className="text-xs text-slate-500">Target Role</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">{distance} km</p>
                    <p className="text-xs text-slate-500">Search Radius</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Broadcast;
