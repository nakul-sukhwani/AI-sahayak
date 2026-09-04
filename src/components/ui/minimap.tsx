'use client';

import { useEffect, useRef, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';

interface MiniMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  className?: string;
}

// Dynamic import of Leaflet to avoid SSR issues
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

export function MiniMap({ lat, lng, zoom = 15, className = "h-48" }: MiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let mapInstance: any = null;

    loadLeaflet().then((L) => {
      if (!mapContainerRef.current) return;
      
      // Prevent multiple initialization
      if ((mapContainerRef.current as any)._leaflet_id) return;

      mapInstance = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        touchZoom: false,
        keyboard: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(mapInstance);

      L.marker([lat, lng]).addTo(mapInstance);

      setIsMapLoaded(true);
    });

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [lat, lng, zoom]);

  return (
    <div className={`relative w-full rounded-xl overflow-hidden border border-[#E2E8F0] ${className}`}>
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
