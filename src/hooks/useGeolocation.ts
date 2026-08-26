'use client';

import { useState, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address: string | null;
  error: string | null;
  isLoading: boolean;
}

interface UseGeolocationReturn extends GeolocationState {
  requestLocation: () => Promise<void>;
  clear: () => void;
}

const INITIAL_STATE: GeolocationState = {
  latitude: null,
  longitude: null,
  accuracy: null,
  address: null,
  error: null,
  isLoading: false,
};

/** Reverse geocodes lat/lng using Nominatim OSM (no API key required) */
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return null;
    const data = await res.json() as { display_name?: string };
    return data.display_name ?? null;
  } catch {
    return null;
  }
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>(INITIAL_STATE);

  const requestLocation = useCallback(async (): Promise<void> => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation is not supported by your browser.' }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        // Fetch address in background — non-blocking
        const address = await reverseGeocode(latitude, longitude);

        setState({
          latitude,
          longitude,
          accuracy,
          address,
          error: null,
          isLoading: false,
        });
      },
      (err) => {
        let message = 'Could not get your location. Please pin it manually on the map.';
        if (err.code === err.PERMISSION_DENIED) {
          message = 'Location access denied. Please pin your location manually.';
        } else if (err.code === err.TIMEOUT) {
          message = 'Location request timed out. Please try again or pin manually.';
        }
        setState((s) => ({ ...s, error: message, isLoading: false }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 30_000,
      }
    );
  }, []);

  const clear = useCallback(() => setState(INITIAL_STATE), []);

  return { ...state, requestLocation, clear };
}
