import { useState, useEffect } from "react";

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
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        setErrorMsg(error.message);
      }
    );
  }, []);

  return { location, errorMsg, setLocation };
}
