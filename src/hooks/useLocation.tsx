import { useState, useEffect } from 'react';

export interface MapCoordinates {
    latitude: number;
    longitude: number;
}

interface ReturnProps {
    location: MapCoordinates | null;
    errorMsg: string | null;
    setLocation: (location: MapCoordinates) => void;
}

const SESSION_KEY = 'approxLocation:v1';

export default function useUserLocation(
    opts: { enabled?: boolean } = {}
): ReturnProps {
    const { enabled = true } = opts;

    const [location, setLocation] = useState<MapCoordinates | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) {
            setErrorMsg(null);
            return;
        }

        let cancelled = false;
        let fallbackTimer: number | undefined;
        const controller = new AbortController();

        const safeSet = <T,>(setter: (v: T) => void, v: T) => {
            if (!cancelled) setter(v);
        };
        const setErr = (msg: string) => safeSet(setErrorMsg, msg);
        const clearErr = () => safeSet(setErrorMsg, null);

        const cacheApprox = (loc: MapCoordinates) => {
            try {
                sessionStorage.setItem(
                    SESSION_KEY,
                    JSON.stringify({ ...loc, ts: Date.now() })
                );
            }
            catch {
                // noop
            }
        };

        const loadApproxFromCache = (): MapCoordinates | null => {
            try {
                const raw = sessionStorage.getItem(SESSION_KEY);
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                if (Date.now() - (parsed.ts ?? 0) > 24 * 60 * 60 * 1000)
                    return null;
                return {
                    latitude: parsed.latitude,
                    longitude: parsed.longitude
                };
            }
            catch {
                return null;
            }
        };

        const fetchApproxLocation = async () => {
            const cached = loadApproxFromCache();
            if (cached) {
                safeSet(setLocation, cached);
                clearErr();
                return;
            }

            try {
                const timeout = setTimeout(() => controller.abort(), 2000);
                const res = await fetch('https://ipapi.co/json/', {
                    signal: controller.signal
                });
                clearTimeout(timeout);

                if (!res.ok) {
                    setErr(
                        'Location unavailable (network limit). Use the search box.'
                    );
                    return;
                }

                const data = await res.json();
                if (data?.latitude && data?.longitude) {
                    const approx = {
                        latitude: data.latitude,
                        longitude: data.longitude
                    };
                    cacheApprox(approx);
                    safeSet(setLocation, approx);
                    clearErr();
                }
                else {
                    setErr('Location unavailable. Use the search box.');
                }
            }
            catch {
                setErr('Location unavailable. Use the search box.');
            }
        };

        const tryGeolocation = () => {
            if (!navigator.geolocation) {
                fetchApproxLocation();
                return;
            }

            let gotFix = false;

            fallbackTimer = window.setTimeout(() => {
                if (!gotFix) fetchApproxLocation();
            }, 3000);

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    gotFix = true;
                    if (fallbackTimer) clearTimeout(fallbackTimer);
                    safeSet(setLocation, {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    });
                    clearErr();
                },
                (err) => {
                    if (fallbackTimer) clearTimeout(fallbackTimer);
                    if (err?.code === 1)
                        setErr(
                            'Location permission denied. Use the search box.'
                        );
                    else if (err?.code === 3)
                        setErr('Location timed out. Use the search box.');
                    else setErr('Location unavailable. Using default center.');
                    fetchApproxLocation();
                },
                { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 }
            );
        };

        tryGeolocation();

        return () => {
            cancelled = true;
            if (fallbackTimer) clearTimeout(fallbackTimer);
            controller.abort();
        };
    }, []);

    return { location, errorMsg, setLocation };
}
