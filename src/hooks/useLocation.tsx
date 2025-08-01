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

export default function useUserLocation(): ReturnProps {
    const [location, setLocation] = useState<MapCoordinates | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const fetchApproxLocation = async () => {
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                if (data && data.latitude && data.longitude) {
                    setLocation({
                        latitude: data.latitude,
                        longitude: data.longitude
                    });
                }
            }
            catch (err) {
                setErrorMsg('Unable to determine location');
            }
        };

        if (!navigator.geolocation) {
            fetchApproxLocation();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            () => {
                fetchApproxLocation();
            }
        );
    }, []);

    return { location, errorMsg, setLocation };
}
