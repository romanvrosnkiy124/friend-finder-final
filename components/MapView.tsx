
import React, { useEffect, useRef } from 'react';
import { User } from '../types';
import { Navigation } from 'lucide-react';

// Declare Leaflet globally
declare const L: any;

interface MapViewProps {
  users: User[];
  currentUser: User;
  onSelectUser: (user: User) => void;
}

export const MapView: React.FC<MapViewProps> = ({ users, currentUser, onSelectUser }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Prevent double init
    if (mapInstanceRef.current) return;

    // Initialize Map
    const map = L.map(mapContainerRef.current, {
        zoomControl: false, // We'll add it manually if needed, or stick to clean UI
        attributionControl: false
    }).setView([currentUser.location.lat, currentUser.location.lng], 13);

    // Add OpenStreetMap Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    // Create a LayerGroup for markers to easily clear them later
    const markersLayer = L.layerGroup().addTo(map);
    
    mapInstanceRef.current = map;
    markersLayerRef.current = markersLayer;

    // Initial render of markers
    renderMarkers();

    // Cleanup on unmount
    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, []);

  // Re-render markers when users or current user changes
  useEffect(() => {
      renderMarkers();
  }, [users, currentUser]);

  const renderMarkers = () => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // 1. Current User Marker (Pulsating Dot)
    const meIcon = L.divIcon({
        className: 'custom-me-icon', // Empty class to avoid default leaflet styles
        html: `
            <div class="relative flex items-center justify-center w-8 h-8">
                <span class="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping"></span>
                <span class="relative inline-flex rounded-full h-8 w-8 bg-indigo-600 border-2 border-white items-center justify-center shadow-lg overflow-hidden">
                    <img src="${currentUser.photoUrl}" class="w-full h-full object-cover" />
                </span>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16] // Center
    });

    L.marker([currentUser.location.lat, currentUser.location.lng], { icon: meIcon })
     .addTo(markersLayerRef.current);

    // 2. Other Users Markers
    users.forEach(user => {
        const commonInterests = user.interests.filter(i => currentUser.interests.includes(i));
        const matchCount = commonInterests.length;
        const isTopMatch = matchCount >= 3;

        // Colors and Styles corresponding to match level
        const borderColor = isTopMatch ? 'border-green-500' : matchCount > 0 ? 'border-orange-500' : 'border-white';
        const badgeColor = isTopMatch ? 'bg-green-500' : 'bg-orange-500';
        
        // Enhance Top Match visibility: Glow shadow + Ring
        const shadowClass = isTopMatch ? 'shadow-[0_0_15px_rgba(34,197,94,0.8)]' : 'shadow-lg';
        const ringClass = isTopMatch ? 'ring-4 ring-green-300/50' : matchCount > 0 ? 'ring-2 ring-orange-200' : '';

        const userIcon = L.divIcon({
            className: 'custom-user-icon',
            html: `
                <div class="relative w-12 h-12 transition-transform duration-200 transform hover:scale-110 group ${isTopMatch ? 'z-20 scale-110' : 'z-10'}">
                    
                    <!-- Badge for Match Count -->
                    ${matchCount > 0 ? `
                    <div class="absolute -top-2 -right-2 z-30 w-6 h-6 flex items-center justify-center rounded-full text-white text-xs font-bold shadow-md ${badgeColor} border-2 border-white">
                        ${matchCount}
                    </div>
                    ` : ''}

                    <!-- Pin Shape -->
                    <div class="absolute inset-0 bg-white rounded-full border-[3px] ${borderColor} ${shadowClass} ${ringClass} overflow-hidden z-20">
                        <img src="${user.photoUrl}" class="w-full h-full object-cover" />
                    </div>
                    
                    <!-- Pointy bottom -->
                    <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b ${borderColor} z-10"></div>
                </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 54] // Tip of the pin
        });

        const marker = L.marker([user.location.lat, user.location.lng], { icon: userIcon })
            .addTo(markersLayerRef.current);

        // Handle click
        marker.on('click', () => {
            onSelectUser(user);
        });
    });
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([currentUser.location.lat, currentUser.location.lng], 14, {
        duration: 1.5
      });
    }
  };

  return (
    <div className="w-full h-full relative">
        <div ref={mapContainerRef} className="w-full h-full z-0 bg-gray-200" />
        
        {/* Recenter Button */}
        <button 
          onClick={handleRecenter}
          className="absolute bottom-24 right-4 bg-white p-3 rounded-full shadow-xl z-10 text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-all active:scale-95 border border-gray-100"
          title="Моё местоположение"
        >
          <Navigation size={24} className="fill-current" />
        </button>
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/50 text-xs text-gray-600 z-10 pointer-events-none">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                    <span className="font-medium text-green-700">Совпадение интересов (≥3)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    <span>Есть общие интересы</span>
                </div>
            </div>
        </div>
    </div>
  );
};
