import { MapPin, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Map as MapGL, Marker, type MapLayerMouseEvent, type MapRef } from 'react-map-gl/maplibre';

import { cn } from '@/lib/utils';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string | undefined;

// Adelaide city centre
const DEFAULT_CENTER = { lng: 138.6007, lat: -34.9285 };
const PROXIMITY = '138.6007,-34.9285';

const mapStyle = (isDark: boolean) =>
    MAPTILER_KEY
        ? `https://api.maptiler.com/maps/${isDark ? 'dataviz-dark' : 'dataviz-light'}/style.json?key=${MAPTILER_KEY}`
        : '';

export interface LocationResult {
    name: string;
    address: string;
    lat: number;
    lng: number;
}

interface GeocodingFeature {
    text: string;
    place_name: string;
    geometry: { coordinates: [number, number] };
}

interface LocationSearchProps {
    value: LocationResult | null;
    onChange: (result: LocationResult | null) => void;
    error?: string;
}

function useDarkMode(): boolean {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    return isDark;
}

export function LocationSearch({ value, onChange, error }: LocationSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GeocodingFeature[]>([]);
    const [loading, setLoading] = useState(false);
    const [reverseLoading, setReverseLoading] = useState(false);
    const [pendingPin, setPendingPin] = useState<{ lng: number; lat: number } | null>(null);
    const [open, setOpen] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapRef>(null);
    const isDark = useDarkMode();

    const [viewState, setViewState] = useState({
        longitude: value ? value.lng : DEFAULT_CENTER.lng,
        latitude: value ? value.lat : DEFAULT_CENTER.lat,
        zoom: value ? 14 : 11,
    });

    // Fly to new value location when value changes externally
    useEffect(() => {
        if (value && mapRef.current) {
            mapRef.current.flyTo({ center: [value.lng, value.lat], zoom: 14, duration: 600 });
        }
    }, [value?.lat, value?.lng]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setOpen(false);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            if (!MAPTILER_KEY) {
                setFetchError('Map API key not configured.');
                return;
            }

            setLoading(true);
            setFetchError(null);

            try {
                const params = new URLSearchParams({
                    key: MAPTILER_KEY,
                    proximity: PROXIMITY,
                    country: 'au',
                    types: 'poi,address,place,neighbourhood',
                    language: 'en',
                    limit: '6',
                });
                const res = await fetch(
                    `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?${params}`,
                );
                if (!res.ok) throw new Error('Request failed');
                const data = await res.json();
                setResults(data.features ?? []);
                setOpen(true);
            } catch {
                setFetchError('Could not search for locations. Please try again.');
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    const reverseGeocode = async (lng: number, lat: number) => {
        if (!MAPTILER_KEY) return;
        setReverseLoading(true);
        setPendingPin(null);
        try {
            const params = new URLSearchParams({ key: MAPTILER_KEY, language: 'en' });
            const res = await fetch(`https://api.maptiler.com/geocoding/${lng},${lat}.json?${params}`);
            if (!res.ok) throw new Error('Request failed');
            const data = await res.json();
            const feature: GeocodingFeature | undefined = data.features?.[0];
            if (feature) {
                onChange({ name: feature.text, address: feature.place_name, lat, lng });
            } else {
                onChange({ name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, address: '', lat, lng });
            }
        } catch {
            onChange({ name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, address: '', lat, lng });
        } finally {
            setReverseLoading(false);
        }
    };

    const handleSelect = (feature: GeocodingFeature) => {
        const [lng, lat] = feature.geometry.coordinates;
        onChange({ name: feature.text, address: feature.place_name, lat, lng });
        setQuery('');
        setResults([]);
        setOpen(false);
    };

    const handleClear = () => {
        onChange(null);
        setQuery('');
        setResults([]);
        setOpen(false);
    };

    const handleMapClick = (e: MapLayerMouseEvent) => {
        const { lng, lat } = e.lngLat;
        setPendingPin({ lng, lat });
        reverseGeocode(lng, lat);
    };

    const handleMarkerDragEnd = (e: { lngLat: { lng: number; lat: number } }) => {
        reverseGeocode(e.lngLat.lng, e.lngLat.lat);
    };

    if (!MAPTILER_KEY) {
        return <p className="text-sm text-destructive">Map API key not configured.</p>;
    }

    return (
        <div ref={containerRef} className={cn('space-y-1.5', error && '')}>
            {/* Map */}
            <div className={cn('relative h-64 overflow-hidden rounded-md border', error && 'border-destructive')}>
                <MapGL
                    ref={mapRef}
                    {...viewState}
                    onMove={(e) => setViewState(e.viewState)}
                    mapStyle={mapStyle(isDark)}
                    onClick={handleMapClick}
                    cursor="crosshair"
                    style={{ width: '100%', height: '100%' }}
                >
                    {value && (
                        <Marker
                            longitude={value.lng}
                            latitude={value.lat}
                            draggable
                            onDragEnd={handleMarkerDragEnd}
                            color="#f97316"
                        />
                    )}
                    {!value && pendingPin && (
                        <Marker
                            longitude={pendingPin.lng}
                            latitude={pendingPin.lat}
                            color="#f97316"
                        />
                    )}
                </MapGL>

                {/* Search overlay */}
                <div className="absolute left-2 right-2 top-2 z-10">
                    {value ? (
                        <div className="flex items-start gap-2 rounded-md border bg-background/95 px-3 py-2 shadow-sm backdrop-blur-sm">
                            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium leading-snug">{value.name}</p>
                                {value.address && value.address !== value.name && (
                                    <p className="truncate text-xs text-muted-foreground">{value.address}</p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                                aria-label="Clear location"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            {loading && (
                                <span className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                            )}
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onFocus={() => results.length > 0 && setOpen(true)}
                                placeholder="Search for a venue or address…"
                                className="flex h-10 w-full rounded-md border border-input bg-background/95 py-2 pl-9 pr-9 text-sm shadow-sm backdrop-blur-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />

                            {open && results.length > 0 && (
                                <div className="absolute z-50 mt-1 w-full overflow-y-auto rounded-md border bg-popover shadow-md" style={{ maxHeight: '240px' }}>
                                    {results.map((feature, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => handleSelect(feature)}
                                            className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-accent"
                                        >
                                            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium leading-snug">{feature.text}</p>
                                                <p className="truncate text-xs text-muted-foreground">{feature.place_name}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Reverse geocoding spinner */}
                {reverseLoading && (
                    <div className="absolute right-2 top-2 z-10 rounded-md bg-background/80 p-1.5 shadow-sm">
                        <span className="block size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                    </div>
                )}
            </div>

            <p className="text-xs text-muted-foreground">Search above or click the map to set a location. Drag the pin to adjust.</p>

            {fetchError && <p className="text-sm text-destructive">{fetchError}</p>}
        </div>
    );
}
