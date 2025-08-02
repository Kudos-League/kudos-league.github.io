import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import debounce from '@/shared/debounce';
import useUserLocation from '@/hooks/useLocation';
import { GOOGLE_LIBRARIES } from '@/shared/constants';

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
    shouldGetYourLocation?: boolean;
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

// const sampleCoordinates = { latitude: 38.8951, longitude: -77.0364 };
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
    onLocationChange,
    shouldGetYourLocation = false
}) => {
    const { location: userLocation } = useUserLocation();
    const fallback = coordinates ?? (shouldGetYourLocation ? userLocation : null); // ?? sampleCoordinates;
    const [mapCoordinates, setMapCoordinates] = useState<MapCoordinates>(fallback);
    
    const hasLocation = coordinates || userLocation;

    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const suppressSearchRef = useRef(false);
    const autoServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
    const placesRef      = useRef<google.maps.places.PlacesService | null>(null);
    const placeLibRef = useRef<google.maps.PlacesLibrary | null>(null);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_KEY,
        libraries: GOOGLE_LIBRARIES as any
    });

    useEffect(() => {
        if (!isLoaded || !window.google?.maps?.places) return;
        (async () => {
            placeLibRef.current = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;
        })();
        autoServiceRef.current  = new google.maps.places.AutocompleteService();
        const dummyDiv          = document.createElement('div');
        placesRef.current       = new google.maps.places.PlacesService(dummyDiv);
    }, [isLoaded]);

    useEffect(() => {
        if (regionID) {
            const alreadySet =
                Math.abs(mapCoordinates?.latitude ?? 0 - fallback?.latitude ?? 0) < 0.0001 &&
                Math.abs(mapCoordinates?.longitude ?? 0 - fallback?.longitude ?? 0) < 0.0001;

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
                    .catch(() => setMapCoordinates(fallback))
                    .finally(() => setLoading(false));
            }
        }
    }, [regionID]);

    useEffect(() => {
        if (shouldGetYourLocation && !coordinates && userLocation) {
            setMapCoordinates(userLocation);
        }
    }, [userLocation]);


    useEffect(() => {
        if (!isLoaded || !searchInput || suppressSearchRef.current) return;
        if (searchInput.length < 3) {
            setSuggestions([]);
            return;
        }

        const run = debounce(() => {
            autoServiceRef.current!.getPlacePredictions(
                { input: searchInput },
                (preds) => setSuggestions(preds ?? [])
            );
        }, 300);

        run();
    }, [searchInput, isLoaded]);

    if (!isLoaded) return <p>Loading Google Maps...</p>;

    const center = {
        lat: mapCoordinates?.latitude,
        lng: mapCoordinates?.longitude
    };

    const isValidCoordinates = mapCoordinates?.latitude != null && mapCoordinates?.longitude != null;

    if (loading) {
        return <p>Loading map...</p>;
    }

    if (!hasLocation) {
        return <p>Loading location...</p>;
    }

    if (!isValidCoordinates) {
        return <p>No location available.</p>;
    }

    return (
        <div style={{ position: 'relative', width, height, overflow: 'visible' }}>
            {showAddressBar && (
                <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 999, width: 300 }}>
                    <input
                        type='text'
                        placeholder='Search address'
                        className="w-full p-2 rounded border border-gray-300 bg-white z-10"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    {suggestions.length > 0 && (
                        <ul className="absolute top-full left-0 right-0 bg-white border border-gray-300 max-h-52 overflow-y-auto z-[1000] shadow-md">
                            {suggestions.map((suggestion, index) => (
                                <li
                                    className="p-2 cursor-pointer border-b border-gray-100 hover:bg-gray-100"
                                    key={suggestion.place_id}
                                    onClick={() => {
                                        placesRef.current!.getDetails(
                                            { placeId: suggestion.place_id, fields: ['geometry', 'formatted_address'] },
                                            (det, status) => {
                                                if (status !== google.maps.places.PlacesServiceStatus.OK || !det?.geometry?.location) {
                                                    return;
                                                }

                                                const newLat = det.geometry.location.lat();
                                                const newLng = det.geometry.location.lng();

                                                const coords = {
                                                    latitude: newLat,
                                                    longitude: newLng,
                                                    changed:
                                                        Math.abs(newLat - mapCoordinates.latitude) > 1e-5 ||
                                                        Math.abs(newLng - mapCoordinates.longitude) > 1e-5
                                                };

                                                suppressSearchRef.current = true;
                                                setSuggestions([]);
                                                setMapCoordinates(coords);
                                                setSearchInput(det.formatted_address ?? suggestion.description);
                                                onLocationChange?.({
                                                    coordinates: coords,
                                                    placeID: suggestion.place_id,
                                                    name: det.formatted_address ?? suggestion.description,
                                                    changed: coords.changed
                                                });
                                                setTimeout(() => (suppressSearchRef.current = false), 500);
                                            }
                                        );
                                    }}
                                >
                                    {suggestion.description}
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
