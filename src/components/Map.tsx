import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { getEndpointUrl } from "shared/api/config";

export interface MapCoordinates {
  latitude: number;
  longitude: number;
  name?: string;
  regionID?: string;
}

interface LocationData {
  coordinates: MapCoordinates;
  placeID: string;
  name?: string;
}

interface MapComponentPropsBase {
  width?: string | number;
  height?: string | number;
  exactLocation?: boolean;
  regionID?: string;
  onLocationChange?: (data: LocationData) => void;
}

type MapComponentProps =
  | ({ showAddressBar: false; coordinates?: MapCoordinates | null } & MapComponentPropsBase)
  | ({ showAddressBar: true; coordinates?: MapCoordinates | null } & MapComponentPropsBase);

const sampleCoordinates = { latitude: 38.8951, longitude: -77.0364 };
const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY!;

const containerStyle = {
  width: "100%",
  height: "400px",
};

async function fetchCoordinatesFromRegionID(regionID: string): Promise<MapCoordinates> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${regionID}&key=${GOOGLE_MAPS_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === "OK" && data.results.length > 0) {
    const loc = data.results[0].geometry.location;
    return { latitude: loc.lat, longitude: loc.lng };
  }
  throw new Error("Geocoding failed");
}

const MapDisplay: React.FC<MapComponentProps> = ({
  showAddressBar,
  coordinates,
  width = "100%",
  height = 400,
  exactLocation = true,
  regionID,
  onLocationChange,
}) => {
  const fallback = coordinates ?? sampleCoordinates;
  const [mapCoordinates, setMapCoordinates] = useState<MapCoordinates>(fallback);
  const [loading, setLoading] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
  });

  useEffect(() => {
    if (regionID) {
      setLoading(true);
      fetchCoordinatesFromRegionID(regionID)
        .then(setMapCoordinates)
        .catch(() => setMapCoordinates(fallback))
        .finally(() => setLoading(false));
    } else if (coordinates) {
      setMapCoordinates(coordinates);
    }
  }, [regionID, coordinates]);

  const handleAddressSearch = useCallback(async (query: string) => {
    const url = `${getEndpointUrl()}/maps/proxy?q=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const loc = data?.results?.[0]?.geometry?.location;
    const name = data?.results?.[0]?.formatted_address;
    const placeID = data?.results?.[0]?.place_id;

    if (loc) {
      const coords = { latitude: loc.lat, longitude: loc.lng };
      setMapCoordinates(coords);
      onLocationChange?.({ coordinates: coords, placeID, name });
    }
  }, [onLocationChange]);

  if (!isLoaded) return <p>Loading Google Maps...</p>;

  const center = {
    lat: mapCoordinates.latitude,
    lng: mapCoordinates.longitude,
  };

  return (
    <div style={{ position: "relative", width, height }}>
      {showAddressBar && (
        <input
          type="text"
          placeholder="Search address"
          style={searchInputStyle}
          onBlur={(e) => handleAddressSearch(e.target.value)}
        />
      )}
      <GoogleMap mapContainerStyle={{ width: "100%", height: "100%" }} center={center} zoom={12}>
        {exactLocation && <Marker position={center} />}
      </GoogleMap>
    </div>
  );
};

const searchInputStyle: React.CSSProperties = {
  position: "absolute",
  top: 10,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 10,
  padding: "0.5rem 1rem",
  borderRadius: 4,
  border: "1px solid #ccc",
  backgroundColor: "white",
  width: 300,
};

export default MapDisplay;
