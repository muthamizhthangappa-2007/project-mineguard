import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, Wrench, Layers, ShieldCheck, MapPin } from 'lucide-react';

// Fix default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MineMapProps {
  mine: any;
  sections: any[];
  equipment: any[];
  observations: any[];
  onSectionClick?: (section: any) => void;
}

export const MineMap: React.FC<MineMapProps> = ({
  mine,
  sections,
  equipment,
  observations,
  onSectionClick,
}) => {
  const [selectedSection, setSelectedSection] = useState<any | null>(null);

  const centerLat = mine?.latitude || 23.6322;
  const centerLng = mine?.longitude || 85.7042;

  // Custom marker icons
  const createPinIcon = (color: string) => {
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  };

  const hazardIcon = createPinIcon('#ef4444');
  const equipmentIcon = createPinIcon('#f59e0b');
  const sectionIcon = createPinIcon('#2563eb');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-slate-100 relative">
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" /> Geographic Mine Intelligence Map
          </h3>
          <p className="text-[11px] text-slate-400">
            OpenStreetMap Surface Coordinates &amp; Section Layout (Surface GPS standard)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 border border-white" /> Sections
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white" /> Equipment
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-white" /> Open Hazards
          </span>
        </div>
      </div>

      <div className="h-[420px] w-full relative z-10">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={15}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Section Centers */}
          {sections.map((sec) => {
            const secLat = centerLat + (sec.code === 'B-12' ? 0.0015 : sec.code === 'A-04' ? 0.004 : -0.002);
            const secLng = centerLng + (sec.code === 'B-12' ? -0.001 : sec.code === 'A-04' ? -0.0025 : 0.002);

            return (
              <Marker
                key={sec.id}
                position={[secLat, secLng]}
                icon={sectionIcon}
                eventHandlers={{
                  click: () => {
                    setSelectedSection(sec);
                    if (onSectionClick) onSectionClick(sec);
                  },
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-1 text-slate-900">
                    <h4 className="font-bold text-sm">Section {sec.code}</h4>
                    <p className="text-xs text-slate-600">{sec.name}</p>
                    <div className="mt-2 text-xs font-semibold space-y-0.5">
                      <p>Risk Level: <span className="font-bold text-amber-600">{sec.riskLevel}</span></p>
                      <p>Equipment Count: {sec._count?.equipment || 0}</p>
                      <p>Active Issues: {sec._count?.observations || 0}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Equipment Markers */}
          {equipment.slice(0, 15).map((eq) => {
            if (!eq.latitude || !eq.longitude) return null;
            return (
              <Marker key={eq.id} position={[eq.latitude, eq.longitude]} icon={equipmentIcon}>
                <Popup>
                  <div className="p-1 text-slate-900">
                    <span className="text-[10px] font-bold text-amber-600 uppercase">{eq.type}</span>
                    <h4 className="font-bold text-sm">{eq.name}</h4>
                    <p className="text-xs text-slate-500 font-mono">{eq.equipmentCode}</p>
                    <p className="text-xs mt-1">Status: <b>{eq.status}</b></p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Observation / Hazard Markers */}
          {observations.slice(0, 10).map((obs) => {
            if (!obs.latitude || !obs.longitude) return null;
            return (
              <Marker key={obs.id} position={[obs.latitude, obs.longitude]} icon={hazardIcon}>
                <Popup>
                  <div className="p-1 text-slate-900">
                    <span className="text-[10px] font-bold text-red-600 uppercase">
                      HAZARD: {obs.severity}
                    </span>
                    <h4 className="font-bold text-xs">{obs.category}</h4>
                    <p className="text-xs text-slate-700 mt-1">{obs.englishReport || obs.description}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Selected Section Details Drawer */}
      {selectedSection && (
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Section {selectedSection.code} Inspectorate</p>
              <p className="text-xs text-slate-400">{selectedSection.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Risk Factor</span>
              <span className="font-bold text-amber-400">{selectedSection.riskLevel}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Registered Machinery</span>
              <span className="font-bold text-white">{selectedSection._count?.equipment || 4} units</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Active Tasks</span>
              <span className="font-bold text-white">{selectedSection._count?.tasks || 1} open</span>
            </div>
            <button
              onClick={() => setSelectedSection(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
