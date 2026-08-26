'use client';

import { useEffect, useRef, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';

interface ComplaintLocation {
  id: string;
  latitude: number;
  longitude: number;
  issue_type: string;
}

interface ActivityMapProps {
  locations: ComplaintLocation[];
}

async function loadLeaflet() {
  const L = (await import('leaflet')).default;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
  return L;
}

export function ActivityMap({ locations }: ActivityMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let mapInstance: any = null;

    loadLeaflet().then((L) => {
      if (!mapContainerRef.current) return;
      
      if ((mapContainerRef.current as any)._leaflet_id) return;

      const defaultLat = locations.length > 0 ? locations[0].latitude : 12.9716;
      const defaultLng = locations.length > 0 ? locations[0].longitude : 77.5946;

      mapInstance = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 12,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(mapInstance);

      const bounds = L.latLngBounds([]);

      locations.forEach(loc => {
        const marker = L.marker([loc.latitude, loc.longitude]).addTo(mapInstance);
        marker.bindPopup(`<b>Issue:</b> <span class="capitalize">${loc.issue_type}</span>`);
        bounds.extend([loc.latitude, loc.longitude]);
      });

      if (locations.length > 0) {
        mapInstance.fitBounds(bounds, { padding: [50, 50] });
      }

      setIsMapLoaded(true);
    });

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [locations]);

  return (
    <div className="relative w-full h-80 rounded-xl overflow-hidden border border-[#E2E8F0]">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#f7f9fb] z-10">
          <Spinner size="md" />
        </div>
      )}
    </div>
  );
}
