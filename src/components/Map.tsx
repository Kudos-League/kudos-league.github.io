import React, { useState, useEffect } from "react";
import GoogleMapReact from "google-map-react";
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

const MarkerComponent: React.FC<{ lat: number; lng: number }> = () => (
  <div style={markerStyle}>📍</div>
);

const sampleCoordinates = { latitude: 38.8951, longitude: -77.0364 };
const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || "";

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
  const fallback = coordinates?.latitude && coordinates?.longitude ? coordinates : sampleCoordinates;
  const [mapCoordinates, setMapCoordinates] = useState<MapCoordinates>(fallback);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (regionID) {
      setLoading(true);
      fetchCoordinatesFromRegionID(regionID)
        .then(setMapCoordinates)
        .catch(() => setMapCoordinates(fallback))
        .finally(() => setLoading(false));
    } else {
      setMapCoordinates(fallback);
    }
  }, [regionID]);

  const renderMap = () => (
    <div style={{ width, height }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: GOOGLE_MAPS_KEY }}
        defaultCenter={{
          lat: exactLocation ? mapCoordinates.latitude : mapCoordinates.latitude + (Math.random() - 0.5) * 0.1,
          lng: exactLocation ? mapCoordinates.longitude : mapCoordinates.longitude + (Math.random() - 0.5) * 0.1,
        }}
        defaultZoom={11}
      >
        {exactLocation && (
          <MarkerComponent lat={mapCoordinates.latitude} lng={mapCoordinates.longitude} />
        )}
      </GoogleMapReact>
    </div>
  );

  return (
    <div style={{ position: "relative" }}>
      {showAddressBar && (
        <input
          type="text"
          placeholder="Search address"
          style={searchInputStyle}
          onBlur={async (e) => {
            const query = e.target.value;
            if (!query) return;
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
          }}
        />
      )}
      {loading ? <p>Loading map...</p> : renderMap()}
    </div>
  );
};

const markerStyle: React.CSSProperties = {
  color: "red",
  fontSize: "24px",
  transform: "translate(-50%, -50%)",
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
};

export default MapDisplay;
