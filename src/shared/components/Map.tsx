import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Button, Platform, ViewStyle, ActivityIndicator } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import Constants from "expo-constants";

export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

// Base props for width/height, exactLocation flag, and optional regionID.
interface MapComponentPropsBase {
  width?: string | number;
  height?: string | number;
  exactLocation?: boolean;
  regionID?: string;
}

// Union type remains similar.
type MapComponentProps =
  | ({ showAddressBar: false; coordinates?: MapCoordinates } & MapComponentPropsBase)
  | ({ showAddressBar: true; coordinates?: MapCoordinates } & MapComponentPropsBase);

interface MarkerComponentProps {
  lat: number;
  lng: number;
}

const GOOGLE_MAPS_KEY = Constants.expoConfig?.extra?.googleMapsKey ?? '';
const GOOGLE_PLACES_KEY = Constants.expoConfig?.extra?.googlePlacesKey ?? '';

const sampleCoordinates: MapCoordinates = {
  latitude: 38.8951,
  longitude: -77.0364,
};

const MarkerComponent: React.FC<MarkerComponentProps> = () => (
  <div style={webMarkerStyle}>●</div>
);

async function fetchCoordinatesFromRegionID(regionID: string): Promise<MapCoordinates> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${regionID}&key=${GOOGLE_PLACES_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error fetching coordinates: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.status === 'OK' && data.results.length > 0) {
    const location = data.results[0].geometry.location;
    return { latitude: location.lat, longitude: location.lng };
  }
  console.warn(data);
  throw new Error('No geocoding results found.');
}

const MapDisplay: React.FC<MapComponentProps> = ({
  showAddressBar,
  coordinates,
  width,
  height,
  exactLocation,
  regionID,
}) => {
  // Use provided coordinates if available, else fallback.
  const fallbackCoordinates: MapCoordinates =
    coordinates && (coordinates.latitude !== 0 || coordinates.longitude !== 0)
      ? coordinates
      : sampleCoordinates;
      
  // State for the map's coordinates.
  const [mapCoordinates, setMapCoordinates] = useState<MapCoordinates | undefined>(undefined);
  const [address, setAddress] = useState('');

  // If regionID is provided, fetch its coordinates using our helper.
  useEffect(() => {
    if (regionID) {
      // If regionID is provided, fetch its coordinates.
      fetchCoordinatesFromRegionID(regionID)
        .then((coords) => {
          setMapCoordinates(coords);
        })
        .catch((err) => {
          console.error("Error fetching coordinates for regionID:", err);
          // Optionally fallback:
          setMapCoordinates(fallbackCoordinates);
        });
    } else {
      // No regionID, so use fallbackCoordinates.
      setMapCoordinates(fallbackCoordinates);
    }
  }, [regionID, fallbackCoordinates]);

  // Placeholder for geocoding API call when the address is submitted.
  const handleAddressSubmit = async () => {
    // Replace with your actual geocoding logic.
    const newCoordinates = sampleCoordinates;
    setMapCoordinates(newCoordinates);
  };

  if (!mapCoordinates) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Determine whether to show the exact location.
  // Defaults to true if not provided.
  const exact = exactLocation !== false;

  // Compute the region center:
  // If exact is false, offset the center slightly by a random amount.
  const regionCenter = exact
    ? mapCoordinates
    : {
        latitude: mapCoordinates.latitude + ((Math.random() - 3) * 0.02),
        longitude: mapCoordinates.longitude + ((Math.random() - 3) * 0.02),
      };

  const region: Region = {
    latitude: regionCenter.latitude,
    longitude: regionCenter.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const renderMap = () => {
    if (Platform.OS === 'web') {
      const GoogleMapReact = require('google-map-react').default;
      const computedWidth =
        width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : webMapStyle.width;
      const computedHeight =
        height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : webMapStyle.height;
      const webStyle: React.CSSProperties = {
        ...webMapStyle,
        width: computedWidth,
        height: computedHeight,
      };

      return (
        <div style={webStyle}>
          <GoogleMapReact
            bootstrapURLKeys={{ key: GOOGLE_MAPS_KEY }}
            defaultCenter={{ lat: region.latitude, lng: region.longitude }}
            defaultZoom={11}
          >
            {exact && <MarkerComponent lat={mapCoordinates.latitude} lng={mapCoordinates.longitude} />}
          </GoogleMapReact>
        </div>
      );
    } else {
      const nativeStyle: ViewStyle = {
        ...(typeof width === 'number' ? { width } : {}),
        ...(typeof height === 'number' ? { height } : {}),
      };
      return (
        <MapView style={[styles.map, nativeStyle]} region={region}>
          {exact && <Marker coordinate={mapCoordinates} />}
        </MapView>
      );
    }
  };

  return (
    <View style={styles.container}>
      {showAddressBar && (
        <View style={styles.addressContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter address"
            value={address}
            onChangeText={setAddress}
            onSubmitEditing={handleAddressSubmit}
          />
          <Button title="Go" onPress={handleAddressSubmit} />
        </View>
      )}
      {renderMap()}
    </View>
  );
};

const webMapStyle: React.CSSProperties = {
  width: '100%',
  height: '100vh',
};

const webMarkerStyle: React.CSSProperties = {
  color: 'red',
  fontSize: '24px',
  transform: 'translate(-50%, -50%)',
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  addressContainer: {
    padding: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 8,
    marginRight: 10,
    borderRadius: 4,
  },
  map: { flex: 1 },
});

export default MapDisplay;
