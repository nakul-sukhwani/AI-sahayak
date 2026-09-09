'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  // Fix default icon paths broken by bundlers
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
    const data = (await res.json()) as { display_name?: string };
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

  // Pin Locking State to prevent accidental displacement
  const [isLocked, setIsLocked] = useState(true);
  const isLockedRef = useRef(true);

  // Precise coordinates state for UI
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat ?? 12.9716,
    lng: initialLng ?? 77.5946,
  });

  const {
    latitude: geoLat,
    longitude: geoLng,
    address: geoAddress,
    isLoading: geoLoading,
    error: geoError,
    requestLocation,
  } = useGeolocation();

  // Keep ref synchronized with state
  useEffect(() => {
    isLockedRef.current = isLocked;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { marker } = leafletRef.current as any;
    if (marker && marker.dragging) {
      if (isLocked || disabled) {
        marker.dragging.disable();
      } else {
        marker.dragging.enable();
      }
    }
  }, [isLocked, disabled]);

  // Center view on pinned marker
  const centerOnMarker = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { map, marker } = leafletRef.current as any;
    if (map && marker) {
      const pos = marker.getLatLng();
      map.setView(pos, 17, { animate: true });
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || isMapLoaded) return;

    const defaultLat = initialLat ?? 12.9716;   // Bangalore center fallback
    const defaultLng = initialLng ?? 77.5946;

    loadLeaflet().then((L) => {
      if (!mapContainerRef.current) return;

      // Destroy any existing instance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((mapContainerRef.current as any)._leaflet_id) return;

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 16,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Marker starts locked by default so user doesn't drag it accidentally
      const marker = L.marker([defaultLat, defaultLng], { draggable: false })
        .addTo(map);

      // Drag end — only fires when unlocked
      marker.on('dragend', async () => {
        if (isLockedRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pos = (marker as any).getLatLng();
        setCurrentCoords({ lat: pos.lat, lng: pos.lng });
        const addr = await reverseGeocode(pos.lat, pos.lng);
        setSelectedAddress(addr);
        onLocationChange(pos.lat, pos.lng, addr);
      });

      // Map click — only moves marker when explicitly unlocked!
      map.on('click', async (e: { latlng: { lat: number; lng: number } }) => {
        if (isLockedRef.current || disabled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (marker as any).setLatLng([e.latlng.lat, e.latlng.lng]);
        setCurrentCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        const addr = await reverseGeocode(e.latlng.lat, e.latlng.lng);
        setSelectedAddress(addr);
        onLocationChange(e.latlng.lat, e.latlng.lng, addr);
      });

      leafletRef.current = { map, marker };
      setIsMapLoaded(true);

      if (initialLat && initialLng) {
        setCurrentCoords({ lat: initialLat, lng: initialLng });
        onLocationChange(initialLat, initialLng, null);
      }
    });

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { map } = leafletRef.current as any;
      if (map) { map.remove(); leafletRef.current = { map: null, marker: null }; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When geolocation resolves — pan map + set exact marker + lock in place
  useEffect(() => {
    if (!geoLat || !geoLng || !isMapLoaded) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { map, marker } = leafletRef.current as any;
    if (!map || !marker) return;

    map.setView([geoLat, geoLng], 17);
    marker.setLatLng([geoLat, geoLng]);
    setCurrentCoords({ lat: geoLat, lng: geoLng });
    setSelectedAddress(geoAddress);
    onLocationChange(geoLat, geoLng, geoAddress);

    // Auto-lock pin to exact GPS coordinates
    setIsLocked(true);
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
      <div className="relative w-full h-64 md:h-84 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" />
        {!isMapLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50">
            <Spinner size="md" />
            <p className="text-xs text-slate-500 font-medium">Initializing OpenStreetMap…</p>
          </div>
        )}

        {/* Map overlay pill — moved to top-right to avoid colliding with Leaflet zoom controls */}
        <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/90 text-[11px] font-bold shadow-sm flex items-center gap-2 pointer-events-none">
          <span
            className={`w-2 h-2 rounded-full ${
              isLocked
                ? 'bg-emerald-500 ring-2 ring-emerald-200'
                : 'bg-amber-500 animate-pulse'
            }`}
          />
          <span className={isLocked ? 'text-emerald-800' : 'text-amber-800'}>
            {isLocked ? 'Coordinates Locked (Exact)' : 'Editing Pin Position'}
          </span>
        </div>
      </div>

      {/* Pin Protection & Precision Coordinate Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs gap-2.5 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isLocked ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {isLocked ? 'lock' : 'lock_open'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-[11px]">
              {isLocked
                ? 'Accidental Pin Movement Protected'
                : 'Free-Placement Active'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {isLocked
                ? 'Pin is fixed at exact coordinates. Dragging the map pans view only.'
                : 'Click or drag the marker to adjust coordinates.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {/* Coordinates readout */}
          <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold">
            {currentCoords.lat.toFixed(5)}°, {currentCoords.lng.toFixed(5)}°
          </div>

          {isLocked ? (
            <button
              type="button"
              onClick={() => setIsLocked(false)}
              disabled={disabled}
              className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">edit_location</span>
              <span>Unlock to Adjust</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsLocked(true)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">check</span>
              <span>Lock Pin Here</span>
            </button>
          )}

          <button
            type="button"
            onClick={centerOnMarker}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Re-center map on pinned coordinates"
          >
            <span className="material-symbols-outlined text-sm">filter_center_focus</span>
            <span className="hidden sm:inline">Center Pin</span>
          </button>
        </div>
      </div>

      {/* GPS button + address card */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="material-symbols-outlined text-blue-600 text-xl flex-shrink-0 mt-0.5">
            location_on
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Resolved Address
            </p>
            <p className="text-xs font-semibold text-slate-800 leading-snug truncate sm:whitespace-normal">
              {displayAddress || 'Tap GPS button or unlock map to pin coordinates'}
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
    </div>
  );
}
