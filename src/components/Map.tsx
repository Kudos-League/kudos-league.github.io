import React, { useState, useEffect, useRef } from 'react';
import Dropdown from '@/components/common/Dropdown';
import {
    GoogleMap,
    Circle,
    Marker,
    useJsApiLoader
} from '@react-google-maps/api';
import debounce from '@/shared/debounce';
import useUserLocation from '@/hooks/useLocation';
import { GOOGLE_LIBRARIES } from '@/shared/constants';
import {
    XMarkIcon,
    GlobeAmericasIcon,
    MapPinIcon
} from '@heroicons/react/16/solid';
import { useAuth } from '@/contexts/useAuth';
import { useUpdateUser } from '@/shared/api/mutations/users';

const SearchInput: React.FC<{
    value: string;
    onChange: (v: string) => void;
    onClear: () => void;
    placeholder?: string;
    showLeftIcon?: boolean;
    label?: string;
}> = ({
    value,
    onChange,
    onClear,
    placeholder = 'Search address',
    showLeftIcon = true,
    label = 'Location'
}) => {
    return (
        <div className='relative'>
            <label
                htmlFor='map-search'
                className='absolute -top-2 left-2 inline-block rounded-lg bg-white px-1 text-xs font-medium text-gray-900 dark:bg-gray-900 dark:text-white'
            >
                {label}
            </label>
            <input
                id='map-search'
                name='map-search'
                type='text'
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoComplete='off'
                className={
                    `block w-full rounded-md bg-white py-1.5 pr-10 ${showLeftIcon ? 'pl-9 sm:pl-9' : 'pl-3'} ` +
                    `text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 ` +
                    `focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ` +
                    `dark:bg-gray-900 dark:text-white dark:outline-gray-600 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500`
                }
            />
            {showLeftIcon && (
                <GlobeAmericasIcon
                    aria-hidden='true'
                    className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400 sm:size-4 dark:text-gray-500'
                />
            )}
            {value && (
                <button
                    type='button'
                    aria-label='Clear search'
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={onClear}
                    className='absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center rounded p-1 text-gray-400 hover:text-gray-600 focus-visible:outline-2 focus-visible:outline-indigo-600'
                >
                    <XMarkIcon className='size-4' aria-hidden='true' />
                </button>
            )}
        </div>
    );
};

export interface MapCoordinates {
    latitude: number;
    longitude: number;
    name?: string;
    regionID?: string;
    changed?: boolean;
}

interface LocationData {
    businessName?: string;
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
    onLocationChange?: (data: LocationData | null) => void;
    onLabelChange?: (label: string) => void;
    approximateRadiusMeters?: number;
    inlineBanner?: boolean;
    shouldSavedLocationButton?: boolean;
}

type MapComponentProps =
    | ({
          edit: false;
          coordinates?: MapCoordinates | null;
      } & MapComponentPropsBase)
    | ({
          edit: true;
          coordinates?: MapCoordinates | null;
      } & MapComponentPropsBase);

const DEFAULT_CENTER = { latitude: 39.8283, longitude: -98.5795 };
const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY!;

const circleOptions = {
    strokeOpacity: 0.7,
    strokeWeight: 2,
    strokeColor: '#2563eb',
    fillColor: '#3b82f6',
    fillOpacity: 0,
    clickable: false,
    draggable: false,
    editable: false,
    zIndex: 1
} as google.maps.CircleOptions;

async function fetchCoordinatesFromRegionID(
    regionID: string,
    authToken?: string
): Promise<MapCoordinates> {
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
        return new Promise<MapCoordinates>((resolve, reject) => {
            try {
                const svc = new google.maps.places.PlacesService(
                    document.createElement('div')
                );
                svc.getDetails(
                    { placeId: regionID, fields: ['geometry'] },
                    (result, status) => {
                        if (
                            status ===
                                google.maps.places.PlacesServiceStatus.OK &&
                            result?.geometry?.location
                        ) {
                            const loc = result.geometry.location;
                            resolve({
                                latitude: loc.lat(),
                                longitude: loc.lng()
                            });
                        }
                        else {
                            reject(
                                new Error(
                                    'PlacesService.getDetails failed: ' + status
                                )
                            );
                        }
                    }
                );
            }
            catch (err) {
                reject(err as Error);
            }
        });
    }
    const GOOGLE_KEY = GOOGLE_MAPS_KEY;
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(regionID)}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_KEY
    };

    headers['X-Goog-FieldMask'] = '*';

    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`Places v1 request failed: ${res.status} ${text}`);
    }
    const data = await res.json();
    const p = data.result ?? data;

    let lat: number | undefined;
    let lng: number | undefined;
    if (p?.geometry?.location) {
        lat = p.geometry.location.lat ?? p.geometry.location.latitude;
        lng = p.geometry.location.lng ?? p.geometry.location.longitude;
    }
    else if (p?.center) {
        lat = p.center.lat ?? p.center.latitude;
        lng = p.center.lng ?? p.center.longitude;
    }
    if (lat != null && lng != null) {
        return { latitude: Number(lat), longitude: Number(lng) };
    }
    throw new Error('Failed to fetch place details for regionID (places v1)');
}

const MapDisplay: React.FC<MapComponentProps> = ({
    edit,
    coordinates = null,
    width = '100%',
    height = 400,
    exactLocation = false,
    regionID,
    onLocationChange,
    onLabelChange,
    shouldGetYourLocation = false,
    approximateRadiusMeters = 300,
    shouldSavedLocationButton = false
}) => {
    const { location: userLocation } = useUserLocation();
    const { user, token } = useAuth();
    const updateUserMutation = useUpdateUser('me');
    const fallback =
        coordinates ?? (shouldGetYourLocation ? userLocation : null);
    const [mapCoordinates, setMapCoordinates] = useState<MapCoordinates>(
        fallback ?? DEFAULT_CENTER
    );
    const [loading, setLoading] = useState(false);
    const [displayLabel, setDisplayLabel] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [saveAsDefault, setSaveAsDefault] = useState(false);

    // Start as cleared when no direct coordinates are provided; pin shows after async regionID fetch resolves
    const [isCleared, setIsCleared] = useState(!coordinates);

    const [selectedSuggestionId, setSelectedSuggestionId] =
        useState<string>('');

    const saveLocationAsDefault = async (locationData: {
        latitude: number;
        longitude: number;
        regionID: string;
        name?: string;
    }) => {
        if (!saveAsDefault || !user) return;

        try {
            await updateUserMutation.mutateAsync({
                location: {
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                    regionID: locationData.regionID,
                    name: locationData.name || ''
                }
            } as any);
        }
        catch (error) {
            console.error('Failed to save default location:', error);
        }
    };

    const selectPlaceById = async (
        placeId: string,
        fallbackDescription?: string
    ) => {
        if (placesRef.current) {
            try {
                await new Promise<void>((resolve) => {
                    placesRef.current!.getDetails(
                        {
                            placeId,
                            fields: [
                                'geometry',
                                'formatted_address',
                                'name',
                                'place_id'
                            ]
                        },
                        (det, status) => {
                            if (
                                status ===
                                    google.maps.places.PlacesServiceStatus.OK &&
                                det?.geometry?.location
                            ) {
                                const newLat = det.geometry.location.lat();
                                const newLng = det.geometry.location.lng();
                                const coords = {
                                    latitude: newLat,
                                    longitude: newLng,
                                    changed:
                                        Math.abs(
                                            newLat - mapCoordinates.latitude
                                        ) > 1e-5 ||
                                        Math.abs(
                                            newLng - mapCoordinates.longitude
                                        ) > 1e-5
                                };

                                const business = det.name ?? '';
                                const formatted =
                                    det.formatted_address ??
                                    fallbackDescription ??
                                    '';
                                const label =
                                    business && !formatted.startsWith(business)
                                        ? `${business}, ${formatted}`
                                        : formatted || business;

                                suppressSearchRef.current = true;
                                setSuggestions([]);
                                setMapCoordinates(coords);
                                setIsCleared(false);
                                setSearchInput(label);
                                setDisplayLabel(label);
                                setIsSearching(false);
                                onLabelChange?.(label);

                                onLocationChange?.({
                                    coordinates: coords,
                                    placeID: det.place_id ?? placeId,
                                    name: label,
                                    businessName: business || undefined,
                                    changed: coords.changed
                                });

                                // Save as default if checkbox is checked
                                saveLocationAsDefault({
                                    latitude: coords.latitude,
                                    longitude: coords.longitude,
                                    regionID: det.place_id ?? placeId,
                                    name: label
                                });

                                setTimeout(
                                    () => (suppressSearchRef.current = false),
                                    500
                                );
                                try {
                                    sessionTokenRef.current =
                                        typeof crypto !== 'undefined' &&
                                        (crypto as any).randomUUID
                                            ? (crypto as any).randomUUID()
                                            : String(Date.now());
                                }
                                catch {
                                    sessionTokenRef.current = String(
                                        Date.now()
                                    );
                                }
                            }
                            resolve();
                        }
                    );
                });
                return;
            }
            catch (err) {
                console.warn(
                    'PlacesService.getDetails failed, falling back to Places v1',
                    err
                );
            }
        }

        try {
            const GOOGLE_KEY = GOOGLE_MAPS_KEY;
            const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_KEY,
                'X-Goog-FieldMask': '*'
            };

            const res = await fetch(url, { method: 'GET', headers });
            if (!res.ok) return;
            const data = await res.json();

            const p = data.result ?? data;

            let lat: number | undefined;
            let lng: number | undefined;
            if (p?.geometry?.location) {
                lat = p.geometry.location.lat ?? p.geometry.location.latitude;
                lng = p.geometry.location.lng ?? p.geometry.location.longitude;
            }
            else if (p?.center) {
                lat = p.center.lat ?? p.center.latitude;
                lng = p.center.lng ?? p.center.longitude;
            }

            if (lat == null || lng == null) return;

            const newLat = Number(lat);
            const newLng = Number(lng);
            const coords = {
                latitude: newLat,
                longitude: newLng,
                changed:
                    Math.abs(newLat - mapCoordinates.latitude) > 1e-5 ||
                    Math.abs(newLng - mapCoordinates.longitude) > 1e-5
            };

            const business = p.displayName ?? p.name ?? '';
            const formatted =
                p.formattedAddress ??
                p.formatted_address ??
                fallbackDescription ??
                '';
            const label =
                business && !formatted.startsWith(business)
                    ? `${business}, ${formatted}`
                    : formatted || business;

            suppressSearchRef.current = true;
            setSuggestions([]);
            setMapCoordinates(coords);
            setIsCleared(false);
            setSearchInput(label);
            setDisplayLabel(label);
            setIsSearching(false);
            onLabelChange?.(label);

            onLocationChange?.({
                coordinates: coords,
                placeID: placeId,
                name: label,
                businessName: business || undefined,
                changed: coords.changed
            });

            // Save as default if checkbox is checked
            saveLocationAsDefault({
                latitude: coords.latitude,
                longitude: coords.longitude,
                regionID: placeId,
                name: label
            });

            setTimeout(() => (suppressSearchRef.current = false), 500);
        }
        catch (err) {
            console.warn('Places v1 direct lookup failed', err);
        }
    };

    const useSavedLocation = async () => {
        if (!user?.location || loading) return;

        setLoading(true);

        const savedLocation = user.location as MapCoordinates;
        const toNum = (v: any) => {
            if (v == null) return NaN;
            const s = String(v)
                .trim()
                .replace(/[,\s]+/g, '');
            return Number.parseFloat(s);
        };

        const coords = {
            latitude: toNum(savedLocation.latitude),
            longitude: toNum(savedLocation.longitude),
            changed: true
        };

        suppressSearchRef.current = true;

        setMapCoordinates(coords);
        setIsCleared(false);
        setIsSearching(false);
        setSuggestions([]);

        if (savedLocation.regionID && placesRef.current) {
            try {
                const request = { placeId: savedLocation.regionID };
                placesRef.current.getDetails(request, (place, status) => {
                    if (
                        status === google.maps.places.PlacesServiceStatus.OK &&
                        place
                    ) {
                        const business = place.name ?? '';
                        const formatted =
                            place.formatted_address ?? savedLocation.name ?? '';
                        const label =
                            business && !formatted.startsWith(business)
                                ? `${business}, ${formatted}`
                                : formatted ||
                                  business ||
                                  savedLocation.name ||
                                  'Saved Location';

                        setSearchInput(label);
                        setDisplayLabel(label);
                        onLabelChange?.(label);

                        onLocationChange?.({
                            coordinates: coords,
                            placeID: savedLocation.regionID || '',
                            name: label,
                            businessName: business || undefined,
                            changed: true
                        });
                    }
                    else {
                        const fallbackLabel =
                            savedLocation.name || 'Saved Location';
                        setSearchInput(fallbackLabel);
                        setDisplayLabel(fallbackLabel);
                        onLabelChange?.(fallbackLabel);

                        onLocationChange?.({
                            coordinates: coords,
                            placeID: savedLocation.regionID || '',
                            name: fallbackLabel,
                            changed: true
                        });
                    }
                    setTimeout(() => {
                        suppressSearchRef.current = false;
                        setLoading(false);
                    }, 500);
                });
            }
            catch (error) {
                console.error('Error fetching place details:', error);
                const fallbackLabel = savedLocation.name || 'Saved Location';
                setSearchInput(fallbackLabel);
                setDisplayLabel(fallbackLabel);
                onLabelChange?.(fallbackLabel);

                onLocationChange?.({
                    coordinates: coords,
                    placeID: savedLocation.regionID || '',
                    name: fallbackLabel,
                    changed: true
                });

                setTimeout(() => {
                    suppressSearchRef.current = false;
                    setLoading(false);
                }, 500);
            }
        }
        else {
            const label = savedLocation.name || 'Saved Location';
            setSearchInput(label);
            setDisplayLabel(label);
            onLabelChange?.(label);

            onLocationChange?.({
                coordinates: coords,
                placeID: savedLocation.regionID || '',
                name: label,
                changed: true
            });

            setTimeout(() => {
                suppressSearchRef.current = false;
                setLoading(false);
            }, 500);
        }
    };

    useEffect(() => {
        if (!user) return;
    }, [user]);

    useEffect(() => {
        if (edit) return;
        if (coordinates) return;
        if (!user?.location) return;

        const savedLocation = user.location as any;
        const toNum = (v: any) => {
            if (v == null) return NaN;
            const s = String(v)
                .trim()
                .replace(/[,\s]+/g, '');
            return Number.parseFloat(s);
        };

        const lat = toNum(savedLocation.latitude);
        const lng = toNum(savedLocation.longitude);

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            const coords = {
                latitude: lat,
                longitude: lng,
                changed: false
            } as MapCoordinates;
            setMapCoordinates(coords);
            setIsCleared(false);

            if (savedLocation.name) {
                setDisplayLabel(savedLocation.name);
            }
        }
    }, [user, edit, coordinates]);
    const prevRegionIDRef = useRef(regionID);
    const suppressSearchRef = useRef(false);
    const autoServiceRef =
        useRef<google.maps.places.AutocompleteService | null>(null);
    const placesRef = useRef<google.maps.places.PlacesService | null>(null);
    const placeLibRef = useRef<google.maps.PlacesLibrary | null>(null);
    const sessionTokenRef = useRef<string>(
        typeof crypto !== 'undefined' && (crypto as any).randomUUID
            ? (crypto as any).randomUUID()
            : String(Date.now())
    );

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_KEY,
        libraries: GOOGLE_LIBRARIES as any
    });

    useEffect(() => {
        if (!isLoaded || !window.google?.maps?.places) return;
        (async () => {
            placeLibRef.current = (await google.maps.importLibrary(
                'places'
            )) as google.maps.PlacesLibrary;
        })();
        autoServiceRef.current = new google.maps.places.AutocompleteService();
        const dummyDiv = document.createElement('div');
        placesRef.current = new google.maps.places.PlacesService(dummyDiv);
    }, [isLoaded]);

    // When regionID prop is removed (e.g. user clicks "Remove" in EditProfile), clear the map state
    useEffect(() => {
        const prev = prevRegionIDRef.current;
        prevRegionIDRef.current = regionID;
        if (prev && !regionID && !coordinates) {
            setIsCleared(true);
            setSearchInput('');
            setDisplayLabel('');
            setMapCoordinates(fallback ?? DEFAULT_CENTER);
            onLabelChange?.('');
        }
    }, [regionID, coordinates]);

    useEffect(() => {
        if (regionID) {
            const alreadySet =
                Math.abs(
                    (mapCoordinates?.latitude ?? 0) - (fallback?.latitude ?? 0)
                ) < 0.0001 &&
                Math.abs(
                    (mapCoordinates?.longitude ?? 0) -
                        (fallback?.longitude ?? 0)
                ) < 0.0001;

            if (
                alreadySet &&
                (!coordinates?.regionID || coordinates.regionID !== regionID)
            ) {
                setLoading(true);
                fetchCoordinatesFromRegionID(regionID, token)
                    .then((coords) => {
                        setMapCoordinates(coords);
                        setIsCleared(false);
                        onLocationChange?.({
                            coordinates: coords,
                            placeID: regionID,
                            name: undefined,
                            changed: false
                        });
                    })
                    .catch(() => {
                        if (fallback) setMapCoordinates(fallback);
                    })
                    .finally(() => setLoading(false));
            }
            setLoading(true);
            fetchCoordinatesFromRegionID(regionID, token)
                .then(async (coords) => {
                    let business = '';
                    let formatted = '';

                    if (placesRef.current) {
                        await new Promise<void>((resolve) => {
                            placesRef.current!.getDetails(
                                {
                                    placeId: regionID,
                                    fields: ['name', 'formatted_address']
                                },
                                (det, status) => {
                                    if (
                                        status ===
                                            google.maps.places
                                                .PlacesServiceStatus.OK &&
                                        det
                                    ) {
                                        business = det.name ?? '';
                                        formatted = det.formatted_address ?? '';
                                    }
                                    resolve();
                                }
                            );
                        });
                    }
                    const label =
                        business && !formatted.startsWith(business)
                            ? `${business}, ${formatted}`
                            : formatted || business;

                    setMapCoordinates(coords);
                    setIsCleared(false);
                    onLocationChange?.({
                        coordinates: coords,
                        placeID: regionID,
                        name: label || undefined,
                        businessName: business || undefined,
                        changed: false
                    });
                    setDisplayLabel(label || '');
                    onLabelChange?.(label || '');
                })
                .catch(() => {
                    if (fallback) setMapCoordinates(fallback);
                })
                .finally(() => setLoading(false));
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
        const run = debounce(async () => {
            if (autoServiceRef.current) {
                try {
                    autoServiceRef.current.getPlacePredictions(
                        { input: searchInput },
                        (preds, status) => {
                            if (
                                status ===
                                    google.maps.places.PlacesServiceStatus.OK &&
                                preds
                            ) {
                                setSuggestions(preds as any[]);
                            }
                            else {
                                setSuggestions([]);
                            }
                        }
                    );
                    return;
                }
                catch (err) {
                    console.warn(
                        'AutocompleteService failed, falling back to proxy',
                        err
                    );
                }
            }

            try {
                const GOOGLE_KEY = GOOGLE_MAPS_KEY;
                const url = `https://places.googleapis.com/v1/places:autocomplete`;
                const body = {
                    input: searchInput,
                    sessionToken: sessionTokenRef.current
                } as any;

                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_KEY
                };

                const res = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body)
                });
                if (!res.ok) {
                    setSuggestions([]);
                    return;
                }
                const data = await res.json();

                const raw =
                    data.predictions ?? data.candidates ?? data.results ?? [];
                const normalized = (Array.isArray(raw) ? raw : []).map(
                    (p: any) => ({
                        description:
                            p.description ??
                            p.displayName ??
                            p.text ??
                            p.label ??
                            p.formattedAddress ??
                            p.name ??
                            '',
                        place_id:
                            p.place_id ?? p.id ?? p.placeId ?? p.name ?? ''
                    })
                );

                setSuggestions(normalized);
            }
            catch (err) {
                console.warn('Places v1 autocomplete failed', err);
                setSuggestions([]);
            }
        }, 300);

        run();
    }, [searchInput, isLoaded]);
    const centerLat = Number(mapCoordinates?.latitude);
    const centerLng = Number(mapCoordinates?.longitude);
    const [randomizedCenter, setRandomizedCenter] = useState<{
        lat: number;
        lng: number;
    } | null>(null);

    useEffect(() => {
        if (exactLocation) {
            setRandomizedCenter(null);
            return;
        }

        const lat = Number(mapCoordinates?.latitude);
        const lng = Number(mapCoordinates?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || isCleared) {
            setRandomizedCenter(null);
            return;
        }

        const min = Math.max(1, approximateRadiusMeters * 0.3);
        const max = Math.max(min + 1, approximateRadiusMeters * 0.7);
        const randDist = Math.random() * (max - min) + min;
        const bearing = Math.random() * 2 * Math.PI;

        const earthRadius = 6378137;
        const deltaLat =
            ((randDist * Math.cos(bearing)) / earthRadius) * (180 / Math.PI);
        const deltaLng =
            ((randDist * Math.sin(bearing)) /
                (earthRadius * Math.cos((lat * Math.PI) / 180))) *
            (180 / Math.PI);

        setRandomizedCenter({ lat: lat + deltaLat, lng: lng + deltaLng });
    }, [mapCoordinates, exactLocation, isCleared, approximateRadiusMeters]);

    const center = randomizedCenter ?? {
        lat: Number.isFinite(centerLat) ? centerLat : DEFAULT_CENTER.latitude,
        lng: Number.isFinite(centerLng) ? centerLng : DEFAULT_CENTER.longitude
    };

    if (!isLoaded) return <p>Loading Google Maps...</p>;

    if (loading) {
        return <p>Loading map...</p>;
    }

    const suggestionOptions = suggestions.map((s: any) => ({
        label: s.description as string,
        value: s.place_id as string
    }));

    const hasSavedLocation =
        user?.location &&
        typeof user.location === 'object' &&
        'latitude' in user.location &&
        'longitude' in user.location;

    return (
        <div
            style={{ position: 'relative', width, height, overflow: 'visible' }}
        >
            {edit && (
                <div
                    style={{
                        position: 'absolute',
                        top: 10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 5
                    }}
                    className='w-[90%] max-w-[300px]'
                >
                    <SearchInput
                        value={searchInput}
                        onChange={(v) => {
                            setSearchInput(v);
                            setIsSearching(true);
                        }}
                        onClear={() => {
                            setSearchInput('');
                            setDisplayLabel('');
                            setSuggestions([]);
                            setIsSearching(false);
                            setIsCleared(true);
                            setMapCoordinates(fallback ?? DEFAULT_CENTER);
                            onLocationChange?.(null);
                            onLabelChange?.('');

                            try {
                                sessionTokenRef.current =
                                    typeof crypto !== 'undefined' &&
                                    (crypto as any).randomUUID
                                        ? (crypto as any).randomUUID()
                                        : String(Date.now());
                            }
                            catch {
                                sessionTokenRef.current = String(Date.now());
                            }
                        }}
                        showLeftIcon={true}
                        placeholder='Search address'
                    />
                    {shouldSavedLocationButton && hasSavedLocation && (
                        <button
                            type='button'
                            onClick={useSavedLocation}
                            disabled={loading}
                            className='mt-2 w-full inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            <MapPinIcon className='size-4' aria-hidden='true' />
                            Use Saved Location
                        </button>
                    )}
                    {shouldSavedLocationButton && !hasSavedLocation && (
                        <label className='mt-2 flex items-center gap-2 px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md cursor-pointer dark:bg-gray-900 dark:text-white dark:border-gray-600'>
                            <input
                                type='checkbox'
                                checked={saveAsDefault}
                                onChange={(e) => setSaveAsDefault(e.target.checked)}
                                className='w-4 h-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:focus:ring-indigo-600'
                            />
                            <span>Save as default address</span>
                        </label>
                    )}
                    {suggestions.length > 0 && (
                        <div className='absolute top-full left-0 right-0 z-[1000]'>
                            <Dropdown
                                value={selectedSuggestionId as any}
                                onChange={(val: string) => {
                                    setSelectedSuggestionId(val);
                                    selectPlaceById(val);
                                }}
                                options={suggestionOptions as any}
                                className='w-full'
                                fullWidth
                                hideButton
                                label={undefined}
                            />
                        </div>
                    )}
                </div>
            )}
            <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={center}
                zoom={12}
                options={{
                    disableDefaultUI: true,
                    clickableIcons: false
                }}
            >
                {!isCleared &&
                    (exactLocation ? (
                        <Marker
                            position={center}
                            draggable={edit}
                            onDragEnd={async (e) => {
                                const newLat = e.latLng?.lat();
                                const newLng = e.latLng?.lng();
                                if (newLat == null || newLng == null) return;

                                try {
                                    let placeID = '';
                                    let formatted = '';
                                    let business = '';

                                    if (
                                        typeof window !== 'undefined' &&
                                        window.google?.maps?.Geocoder
                                    ) {
                                        await new Promise<void>((resolve) => {
                                            const geocoder =
                                                new google.maps.Geocoder();
                                            geocoder.geocode(
                                                {
                                                    location: {
                                                        lat: newLat,
                                                        lng: newLng
                                                    }
                                                },
                                                (results, status) => {
                                                    if (
                                                        status ===
                                                            google.maps
                                                                .GeocoderStatus
                                                                .OK &&
                                                        results &&
                                                        results.length > 0
                                                    ) {
                                                        const res = results[0];
                                                        placeID =
                                                            (res as any)
                                                                .place_id ?? '';
                                                        formatted =
                                                            res.formatted_address ??
                                                            '';
                                                    }
                                                    resolve();
                                                }
                                            );
                                        });

                                        if (placeID && placesRef.current) {
                                            await new Promise<void>(
                                                (resolve) => {
                                                    placesRef.current!.getDetails(
                                                        {
                                                            placeId: placeID,
                                                            fields: [
                                                                'name',
                                                                'formatted_address'
                                                            ]
                                                        },
                                                        (det, status) => {
                                                            if (
                                                                status ===
                                                                    google.maps
                                                                        .places
                                                                        .PlacesServiceStatus
                                                                        .OK &&
                                                                det
                                                            ) {
                                                                business =
                                                                    det.name ??
                                                                    '';
                                                                formatted =
                                                                    det.formatted_address ??
                                                                    formatted;
                                                            }
                                                            resolve();
                                                        }
                                                    );
                                                }
                                            );
                                        }
                                    }
                                    else {
                                        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${newLat},${newLng}&key=${GOOGLE_MAPS_KEY}`;

                                        const response =
                                            await fetch(geocodeUrl);
                                        if (response.ok) {
                                            const data = await response.json();
                                            const result = data.results?.[0];
                                            placeID = result?.place_id ?? '';
                                            formatted =
                                                result?.formatted_address ?? '';
                                        }
                                    }
                                    const label =
                                        business &&
                                        !formatted.startsWith(business)
                                            ? `${business}, ${formatted}`
                                            : formatted || business;

                                    const coords = {
                                        latitude: newLat,
                                        longitude: newLng,
                                        changed: true
                                    };

                                    suppressSearchRef.current = true;
                                    setSuggestions([]);
                                    setMapCoordinates(coords);
                                    setIsCleared(false);
                                    setSearchInput(label);
                                    onLabelChange?.(label);

                                    onLocationChange?.({
                                        coordinates: coords,
                                        placeID,
                                        name: label,
                                        businessName: business || undefined,
                                        changed: true
                                    });

                                    // Save as default if checkbox is checked
                                    saveLocationAsDefault({
                                        latitude: coords.latitude,
                                        longitude: coords.longitude,
                                        regionID: placeID,
                                        name: label
                                    });

                                    setTimeout(() => {
                                        suppressSearchRef.current = false;
                                    }, 500);
                                }
                                catch (err) {
                                    console.error(
                                        'Reverse geocoding failed',
                                        err
                                    );
                                }
                            }}
                        />
                    ) : (
                        <Circle
                            center={center}
                            radius={approximateRadiusMeters}
                            options={circleOptions}
                        />
                    ))}
            </GoogleMap>
        </div>
    );
};

export default MapDisplay;
