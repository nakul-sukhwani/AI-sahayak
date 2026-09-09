'use client';

import { useEffect, useRef, useState } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useLanguage } from '@/context/LanguageContext';
import { Spinner } from '@/components/ui/spinner';

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (lat: number, lng: number, address: string | null) => void;
  disabled?: boolean;
}

interface LeafletInstance {
  // Minimal types to avoid importing leaflet at module level (SSR safe)
  map: unknown;
  marker: unknown;
}

// Dynamic import of Leaflet to avoid SSR issues
async function loadLeaflet() {
  const L = (await import('leaflet')).default;
  // Fix default icon paths broken by webpack
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
  return L;
}

/** Reverse geocodes using Nominatim */
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return null;
    const data = await res.json() as { display_name?: string };
    return data.display_name ?? null;
  } catch {
    return null;
  }
}

export function MapPicker({
  initialLat,
  initialLng,
  onLocationChange,
  disabled = false,
}: MapPickerProps) {
  const { t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<LeafletInstance>({ map: null, marker: null });
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const {
    latitude: geoLat,
    longitude: geoLng,
    address: geoAddress,
    isLoading: geoLoading,
    error: geoError,
    requestLocation,
  } = useGeolocation();

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || isMapLoaded) return;

    const defaultLat = initialLat ?? 12.9716;   // Bangalore center
    const defaultLng = initialLng ?? 77.5946;

    loadLeaflet().then((L) => {
      if (!mapContainerRef.current) return;

      // Destroy any existing instance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((mapContainerRef.current as any)._leaflet_id) return;

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Place initial marker if coordinates provided
      const marker = L.marker([defaultLat, defaultLng], { draggable: !disabled })
        .addTo(map);

      // Drag end — update coordinates + reverse geocode
      marker.on('dragend', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pos = (marker as any).getLatLng();
        const addr = await reverseGeocode(pos.lat, pos.lng);
        setSelectedAddress(addr);
        onLocationChange(pos.lat, pos.lng, addr);
      });

      // Click on map — move marker
      map.on('click', async (e: { latlng: { lat: number; lng: number } }) => {
        if (disabled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (marker as any).setLatLng([e.latlng.lat, e.latlng.lng]);
        const addr = await reverseGeocode(e.latlng.lat, e.latlng.lng);
        setSelectedAddress(addr);
        onLocationChange(e.latlng.lat, e.latlng.lng, addr);
      });

      leafletRef.current = { map, marker };
      setIsMapLoaded(true);

      if (initialLat && initialLng) {
        onLocationChange(initialLat, initialLng, null);
      }
    });

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { map } = leafletRef.current as any;
      if (map) { map.remove(); leafletRef.current = { map: null, marker: null }; }
    };
  // Only run once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When geolocation resolves — pan map + move marker
  useEffect(() => {
    if (!geoLat || !geoLng || !isMapLoaded) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { map, marker } = leafletRef.current as any;
    if (!map || !marker) return;
    map.setView([geoLat, geoLng], 17);
    marker.setLatLng([geoLat, geoLng]);
    setSelectedAddress(geoAddress);
    onLocationChange(geoLat, geoLng, geoAddress);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoLat, geoLng]);

  const displayAddress = selectedAddress ?? geoAddress;

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />

      {/* Map container */}
      <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" />
        {!isMapLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50">
            <Spinner size="md" />
            <p className="text-xs text-slate-500 font-medium">Initializing OpenStreetMap…</p>
          </div>
        )}

        {/* Map overlay pill */}
        <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/90 text-[11px] font-semibold text-slate-700 shadow-sm flex items-center gap-1.5 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>Interactive Pin Drop</span>
        </div>
      </div>

      {/* GPS button + address card */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined text-blue-600 text-xl flex-shrink-0 mt-0.5">
            location_on
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Resolved Address
            </p>
            <p className="text-xs font-semibold text-slate-800 leading-snug">
              {displayAddress || 'Tap GPS button or click on map to pin coordinates'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={requestLocation}
          disabled={geoLoading || disabled}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#002147] hover:bg-[#001833]
                     rounded-xl shadow-sm transition-all duration-150
                     disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {geoLoading ? (
            <Spinner size="sm" />
          ) : (
            <span className="material-symbols-outlined text-base">my_location</span>
          )}
          <span>{geoLoading ? t('locating') : (t('use_my_location') || 'Use Live GPS')}</span>
        </button>
      </div>

      {geoError && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-amber-600">warning</span>
          <span>{geoError}</span>
        </div>
      )}

      <p className="text-[11px] text-slate-400 flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">touch_app</span>
        {t('tap_map_adjust') || 'Tap anywhere on the map or drag the blue marker to refine the exact location.'}
      </p>
    </div>
  );
}
