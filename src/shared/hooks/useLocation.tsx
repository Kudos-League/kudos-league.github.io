import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

export default function useUserLocation(): { location: MapCoordinates | null; errorMsg: string | null } {
  const [location, setLocation] = useState<MapCoordinates | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (navigator.geolocation) {
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
      } else {
        setErrorMsg("Geolocation is not supported by this browser.");
      }
    } else {
      import('expo-location')
        .then((Location) => {
          (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
              setErrorMsg('Permission to access location was denied');
              return;
            }
            const currentLocation = await Location.getCurrentPositionAsync({});
            setLocation({
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            });
          })();
        })
        .catch((err) => {
          setErrorMsg(err.message);
        });
    }
  }, []);

  return { location, errorMsg };
}
