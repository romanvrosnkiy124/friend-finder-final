import React, { useEffect, useRef } from 'react';
import { User } from '../types';
import { Navigation } from 'lucide-react';

// Объявляем Leaflet глобально (так сделано в твоей версии)
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
    if (mapInstanceRef.current) return;

    // Инициализация карты
    const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
    }).setView([currentUser.location.lat, currentUser.location.lng], 13);

    // Слой OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    
    mapInstanceRef.current = map;
    markersLayerRef.current = markersLayer;

    renderMarkers();

    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    };
  }, []);

  useEffect(() => {
      renderMarkers();
  }, [users, currentUser]);

  const renderMarkers = () => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // 1. Маркер меня (Я)
    const meIcon = L.divIcon({
        className: 'custom-me-icon',
        html: `
            <div class="relative flex items-center justify-center w-8 h-8">
                <span class="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping"></span>
                <span class="relative inline-flex rounded-full h-8 w-8 bg-indigo-600 border-2 border-white items-center justify-center shadow-lg overflow-hidden">
                    <img src="${currentUser.photoUrl}" class="w-full h-full object-cover" />
                </span>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });

    L.marker([currentUser.location.lat, currentUser.location.lng], { icon: meIcon })
     .addTo(markersLayerRef.current);

    // 2. Маркеры других людей
    users.forEach(user => {
        const commonInterests = user.interests.filter(i => currentUser.interests.includes(i));
        const matchCount = commonInterests.length;
        
        // ИЗМЕНЕНИЕ: Зеленый, если есть ХОТЯ БЫ 1 совпадение
        const isTopMatch = matchCount >= 1;

        // Цвета: Зеленый или Белый (убрали оранжевый)
        const borderColor = isTopMatch ? 'border-green-500' : 'border-white';
        const badgeColor = isTopMatch ? 'bg-green-500' : 'bg-gray-400';
        
        // Свечение только для совпадений
        const shadowClass = isTopMatch ? 'shadow-[0_0_15px_rgba(34,197,94,0.8)]' : 'shadow-lg';
        const ringClass = isTopMatch ? 'ring-4 ring-green-300/50' : '';

        const userIcon = L.divIcon({
            className: 'custom-user-icon',
            html: `
                <div class="relative w-12 h-12 transition-transform duration-200 transform hover:scale-110 group ${isTopMatch ? 'z-20 scale-110' : 'z-10'}">
                    
                    <!-- Бейдж с количеством совпадений (показываем, если > 0) -->
                    ${matchCount > 0 ? `
                    <div class="absolute -top-2 -right-2 z-30 w-6 h-6 flex items-center justify-center rounded-full text-white text-xs font-bold shadow-md ${badgeColor} border-2 border-white">
                        ${matchCount}
                    </div>
                    ` : ''}

                    <!-- Фото в кружке -->
                    <div class="absolute inset-0 bg-white rounded-full border-[3px] ${borderColor} ${shadowClass} ${ringClass} overflow-hidden z-20">
                        <img src="${user.photoUrl || 'https://via.placeholder.com/150'}" class="w-full h-full object-cover" />
                    </div>
                    
                    <!-- Стрелочка снизу -->
                    <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b ${borderColor} z-10"></div>
                </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 54]
        });

        const marker = L.marker([user.location.lat, user.location.lng], { icon: userIcon })
            .addTo(markersLayerRef.current);

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
        
        {/* Кнопка "Где я" */}
        <button 
          onClick={handleRecenter}
          className="absolute bottom-24 right-4 bg-white p-3 rounded-full shadow-xl z-10 text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-all active:scale-95 border border-gray-100"
          title="Моё местоположение"
        >
          <Navigation size={24} className="fill-current" />
        </button>
        
        {/* ИЗМЕНЕНИЕ: ЛЕГЕНДА (Одна строка) */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/50 text-xs text-gray-600 z-10 pointer-events-none">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                    <span className="font-medium text-green-700">Совпадение интересов (1+)</span>
                </div>
            </div>
        </div>
    </div>
  );
};