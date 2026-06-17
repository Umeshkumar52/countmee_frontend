import { useEffect, useState } from "react";
import {
  fetchBroadcast,
  updateMinBroadcastDistance,
  createBroadcastPoint,
} from "../../../api/admin.api";
import Table from "../../../components/common/Table";
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";

export const Broadcast = () => {
  const [broadcasts, setBroadcasts] = useState([]);
  const [minDistance, setMinDistance] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingDist, setIsUpdatingDist] = useState(false);

  // New broadcast point state
  const [name, setName] = useState("");
  const [radius, setRadius] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [isSubmit, setIsSubmit] = useState(false);

  const fetchBroadcastData = async () => {
    setIsLoading(true);
    try {
      const response = await fetchBroadcast();
      const data = response.data.data || response.data;
      setBroadcasts(data.broadcasts || []);
      setMinDistance(data.minBroadcastDistance || 3);
    } catch (e) {
      console.error("Failed to load broadcasts", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcastData();
  }, []);

  const handleUpdateMinDist = async (e) => {
    e.preventDefault();
    setIsUpdatingDist(true);
    try {
      await updateMinBroadcastDistance({
        min_distance: parseFloat(minDistance),
      });
      alert("Minimum broadcast distance parameter updated successfully!");
      fetchBroadcastData();
    } catch (e) {
      console.error("Failed to update distance rule", e);
    } finally {
      setIsUpdatingDist(false);
    }
  };

  const handleCreatePoint = async (e) => {
    e.preventDefault();
    setIsSubmit(true);
    try {
      await createBroadcastPoint({ name, radius, lat, lon });
      setName("");
      setRadius("");
      setLat("");
      setLon("");
      alert("New broadcast coordinate point saved!");
      fetchBroadcastData();
    } catch (e) {
      console.error("Failed to save point", e);
    } finally {
      setIsSubmit(false);
    }
  };

  const headers = ["Point ID", "Name", "Radius (m)", "Coordinates", "Status"];

  return (
    <div className="space-y-6 text-left page-transition">
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          Broadcast Configurations
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage parcel assignment radii and locate hub coverage points
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side Forms: Min distance and Point Creation */}
        <div className="lg:col-span-1 space-y-6">
          {/* Min Distance Rule form */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4">
              Coverage Parameters
            </h3>
            <form onSubmit={handleUpdateMinDist} className="space-y-4">
              <Input
                label="Minimum Broadcast Distance (km)"
                id="minDistance"
                type="number"
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
                className="w-full"
              >
                Save Parameter
              </Button>
            </form>
          </div>

          {/* Point Creation form */}
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4">
              Add Broadcast Point
            </h3>
            <form onSubmit={handleCreatePoint} className="space-y-4">
              <Input
                label="Point Location Name"
                id="name"
                placeholder="e.g. Connaught Place Hub"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Broadcast Radius (meters)"
                id="radius"
                type="number"
                placeholder="e.g. 5000"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Latitude"
                  id="lat"
                  placeholder="e.g. 28.6139"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  required
                />
                <Input
                  label="Longitude"
                  id="lon"
                  placeholder="e.g. 77.2090"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                isLoading={isSubmit}
                variant="primary"
                size="sm"
                className="w-full"
              >
                Create Point
              </Button>
            </form>
          </div>
        </div>

        {/* Right Side: Points Listing */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wide pl-1">
            Active Coverage Points
          </h3>
          <Table
            headers={headers}
            data={broadcasts}
            isLoading={isLoading}
            emptyMessage="No broadcast coordinate points configured yet."
            renderRow={(point) => (
              <tr
                key={point.id}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-5 py-4 text-xs font-bold text-slate-400">
                  #BP-{point.id}
                </td>
                <td className="px-5 py-4 text-xs font-bold text-slate-800">
                  {point.name}
                </td>
                <td className="px-5 py-4 text-xs text-slate-600">
                  {point.radius} m
                </td>
                <td className="px-5 py-4 text-xs text-slate-500">
                  {point.lat}, {point.lon}
                </td>
                <td className="px-5 py-4 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{" "}
                    Active
                  </span>
                </td>
              </tr>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default Broadcast;
