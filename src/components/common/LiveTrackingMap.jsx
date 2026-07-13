import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom truck icon
const truckSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40">
  <rect x="2" y="5" width="13" height="13" rx="1.5" fill="#1e40af" />
  <path d="M15 8h4.5l3.5 4v6h-8V8z" fill="#3b82f6" />
  <circle cx="6" cy="19" r="3" fill="#0f172a"/>
  <circle cx="19" cy="19" r="3" fill="#0f172a"/>
  <rect x="17" y="10" width="3" height="3" fill="#93c5fd" />
</svg>
`);
const truckIcon = new L.Icon({
  iconUrl: `data:image/svg+xml;charset=utf-8,\${truckSvg}`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return (R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)))).toFixed(1);
};

const LiveTrackingMap = ({ dpLocation, waypoints = [], height = "350px" }) => {
  const defaultCenter = [12.9716, 77.5946];
  const mapCenter = dpLocation || (waypoints.length > 0 ? waypoints[0].coord : defaultCenter);
  
  const pathCoords = [];
  if (dpLocation) pathCoords.push(dpLocation);
  waypoints.forEach(pt => pathCoords.push(pt.coord));

  return (
    <div className="w-full relative z-0" style={{ height }}>
      <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%", zIndex: 0 }} zoomControl={false}>
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          attribution='&copy; Google Maps'
        />
        {dpLocation && <MapUpdater center={dpLocation} />}
        
        {dpLocation && (
          <Marker position={dpLocation} icon={truckIcon}>
            <Popup>
               <strong>DP Current Location</strong>
               {waypoints.length > 0 && (
                 <div className="text-xs text-slate-500 mt-1">
                   Distance to next waypoint: {calculateDistance(dpLocation[0], dpLocation[1], waypoints[0].coord[0], waypoints[0].coord[1])} km
                 </div>
               )}
            </Popup>
          </Marker>
        )}

        {waypoints.map((pt, i) => {
          const markerProps = pt.type === "Drop-off" ? { icon: redIcon } : {};
          return (
            <Marker key={i} position={pt.coord} {...markerProps}>
              <Popup>
                <strong>{pt.type} Point</strong><br />
                Order: {pt.id}
                {dpLocation && (
                   <div className="text-xs text-slate-500 mt-1">
                     Distance from DP: {calculateDistance(dpLocation[0], dpLocation[1], pt.coord[0], pt.coord[1])} km
                   </div>
                 )}
              </Popup>
            </Marker>
          );
        })}

        {pathCoords.length > 1 && (
          <Polyline positions={pathCoords} color="#2563eb" weight={4} opacity={0.7} dashArray="10, 10" />
        )}
      </MapContainer>
    </div>
  );
};

export default LiveTrackingMap;
