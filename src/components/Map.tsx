import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { getGeocodedLocation } from '@/shared/api/actions';
import { useAuth } from '@/hooks/useAuth';
import debounce from '@/shared/debounce';

export interface MapCoordinates {
    latitude: number;
    longitude: number;
    name?: string;
    regionID?: string;
    changed?: boolean;
}

interface LocationData {
    coordinates: MapCoordinates;
    placeID: string;
    name?: string;
    changed: boolean;
}

interface MapComponentPropsBase {
    width?: string | number;
    height?: string | number;
    exactLocation?: boolean;
    regionID?: string;
    onLocationChange?: (data: LocationData) => void;
}

type MapComponentProps =
    | ({
          showAddressBar: false;
          coordinates?: MapCoordinates | null;
      } & MapComponentPropsBase)
    | ({
          showAddressBar: true;
          coordinates?: MapCoordinates | null;
      } & MapComponentPropsBase);

const sampleCoordinates = { latitude: 38.8951, longitude: -77.0364 };
const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY!;

async function fetchCoordinatesFromRegionID(
    regionID: string
): Promise<MapCoordinates> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${regionID}&key=${GOOGLE_MAPS_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'OK' && data.results.length > 0) {
        const loc = data.results[0].geometry.location;
        return { latitude: loc.lat, longitude: loc.lng };
    }
    throw new Error('Geocoding failed');
}

const MapDisplay: React.FC<MapComponentProps> = ({
    showAddressBar,
    coordinates,
    width = '100%',
    height = 400,
    exactLocation = true,
    regionID,
    onLocationChange
}) => {
    const { token } = useAuth();
    const fallback = coordinates ?? sampleCoordinates;
    const [mapCoordinates, setMapCoordinates] =
        useState<MapCoordinates>(fallback);
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const suppressSearchRef = useRef(false);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_KEY
    });

    useEffect(() => {
        if (regionID) {
            const alreadySet =
                Math.abs(mapCoordinates.latitude - fallback.latitude) < 0.0001 &&
                Math.abs(mapCoordinates.longitude - fallback.longitude) < 0.0001;

            if (alreadySet && (!coordinates?.regionID || coordinates.regionID !== regionID)) {
                setLoading(true);
                fetchCoordinatesFromRegionID(regionID)
                    .then((coords) => {
                        setMapCoordinates(coords);
                        onLocationChange?.({
                            coordinates: coords,
                            placeID: regionID,
                            name: undefined,
                            changed: false
                        });
                    })
                    .catch(() => setMapCoordinates(sampleCoordinates))
                    .finally(() => setLoading(false));
            }
        }
    }, [regionID]);

    useEffect(() => {
        if (!searchInput || !token || suppressSearchRef.current) return;

        const debouncedSearch = debounce(async () => {
            try {
                const data = await getGeocodedLocation(searchInput, token);
                setSuggestions(data?.results ?? []);
            }
            catch (err) {
                console.error('Error fetching suggestions:', err);
                setSuggestions([]);
            }
        }, 300);

        debouncedSearch();

        return () => {
            setSuggestions([]);
        };
    }, [searchInput, token]);


    if (!isLoaded) return <p>Loading Google Maps...</p>;

    const center = {
        lat: mapCoordinates.latitude,
        lng: mapCoordinates.longitude
    };

    if (loading) {
        return <p>Loading map...</p>;
    }

    return (
        <div style={{ position: 'relative', width, height, overflow: 'visible' }}>
            {showAddressBar && (
                <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 999, width: 300 }}>
                    <input
                        type='text'
                        value={searchInput}
                        placeholder='Search address'
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="w-full p-2 rounded border border-gray-300 bg-white z-10"
                    />
                    {suggestions.length > 0 && (
                        <ul className="absolute top-full left-0 right-0 bg-white border border-gray-300 max-h-52 overflow-y-auto z-[1000] shadow-md">
                            {suggestions.map((suggestion, index) => (
                                <li
                                    key={index}
                                    className="p-2 cursor-pointer border-b border-gray-100 hover:bg-gray-100"
                                    onClick={() => {
                                        const loc = suggestion.geometry.location;
                                        const name = suggestion.formatted_address;
                                        const placeID = suggestion.place_id;

                                        const newLat = loc.lat;
                                        const newLng = loc.lng;

                                        const isSameCoords =
                                            Math.abs(newLat - mapCoordinates.latitude) < 0.00001 &&
                                            Math.abs(newLng - mapCoordinates.longitude) < 0.00001;

                                        const coords = {
                                            latitude: newLat,
                                            longitude: newLng,
                                            changed: !isSameCoords
                                        };

                                        suppressSearchRef.current = true;
                                        setSuggestions([]);
                                        setMapCoordinates(coords);
                                        setSearchInput(name);
                                        onLocationChange?.({
                                            coordinates: coords,
                                            placeID,
                                            name,
                                            changed: !isSameCoords
                                        });

                                        setTimeout(() => {
                                            suppressSearchRef.current = false;
                                        }, 500);
                                    }}
                                >
                                    {suggestion.formatted_address}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={center}
                zoom={12}
                options={{
                    disableDefaultUI: true,
                    clickableIcons: false,
                    /*
                    styles: [
                        {
                            featureType: 'poi',
                            elementType: 'labels',
                            stylers: [{ visibility: 'off' }]
                        },
                        {
                            featureType: 'transit',
                            elementType: 'labels',
                            stylers: [{ visibility: 'off' }]
                        },
                        {
                            featureType: 'road',
                            elementType: 'labels',
                            stylers: [{ visibility: 'off' }]
                        },
                        {
                            featureType: 'administrative',
                            elementType: 'labels',
                            stylers: [{ visibility: 'off' }]
                        }
                    ]
                    */
                }}
            >
                {exactLocation && (
                    <Marker
                        position={center}
                        draggable={showAddressBar}
                        onDragEnd={async (e) => {
                            const newLat = e.latLng?.lat();
                            const newLng = e.latLng?.lng();

                            if (newLat == null || newLng == null) return;

                            try {
                                const response = await fetch(
                                    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${newLat},${newLng}&key=${GOOGLE_MAPS_KEY}`
                                );
                                const data = await response.json();
                                const result = data.results?.[0];
                                const name = result?.formatted_address ?? '';
                                const placeID = result?.place_id ?? '';

                                const coords = {
                                    latitude: newLat,
                                    longitude: newLng,
                                    changed: true
                                };

                                suppressSearchRef.current = true;
                                setSuggestions([]);
                                setMapCoordinates(coords);
                                setSearchInput(name);
                                onLocationChange?.({
                                    coordinates: coords,
                                    placeID,
                                    name,
                                    changed: true
                                });
                                setTimeout(() => {
                                    suppressSearchRef.current = false;
                                }, 500);
                            }
                            catch (err) {
                                console.error('Reverse geocoding failed', err);
                            }
                        }}
                    />
                )}
            </GoogleMap>
        </div>

    );
};

export default MapDisplay;
