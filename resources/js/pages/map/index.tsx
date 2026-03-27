import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ExternalLink, MapPin, X } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layer, Map, Marker, Source } from 'react-map-gl/maplibre';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MapEvent {
    id: number;
    title: string;
    start_datetime: string;
    end_datetime: string;
    category_slug: string;
    category_name: string;
    url: string | null;
    ride_distance_km: number | null;
    is_featured: boolean;
    route_geojson: GeoJSON.FeatureCollection | null;
}

interface MapMarker {
    location_id: number;
    location_name: string;
    latitude: number;
    longitude: number;
    events: MapEvent[];
}

interface MapIndexProps {
    markers: MapMarker[];
    selectedDate: string;
    availableDates: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string | undefined;
const MAP_STYLE = `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY ?? ''}`;

// Default view centred on the Adelaide region
const DEFAULT_VIEW = { longitude: 138.7, latitude: -34.9, zoom: 8 };

const CATEGORY_COLORS: Record<string, string> = {
    'race-stages':     'bg-blue-600',
    'official-events': 'bg-violet-600',
    'watch-parties':   'bg-sky-500',
    'group-rides':     'bg-orange-500',
    'local-racing':    'bg-purple-500',
    'pop-up':          'bg-rose-400',
    'expo':            'bg-teal-500',
    'pop-ups':         'bg-cyan-500',
    'team-meets':      'bg-indigo-500',
    'food-wine':       'bg-amber-500',
    'entertainment':   'bg-pink-500',
    'podcast':         'bg-lime-600',
    'other':           'bg-gray-500',
};

function getCategoryColor(slug: string): string {
    return CATEGORY_COLORS[slug] ?? CATEGORY_COLORS['other'];
}

// Hex colours for MapLibre line layers (mirrors CATEGORY_COLORS above)
const CATEGORY_LINE_COLORS: Record<string, string> = {
    'race-stages':     '#2563eb',
    'official-events': '#7c3aed',
    'watch-parties':   '#0ea5e9',
    'group-rides':     '#f97316',
    'local-racing':    '#a855f7',
    'pop-up':          '#fb7185',
    'expo':            '#14b8a6',
    'pop-ups':         '#06b6d4',
    'team-meets':      '#6366f1',
    'food-wine':       '#f59e0b',
    'entertainment':   '#ec4899',
    'podcast':         '#65a30d',
    'other':           '#6b7280',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Datetimes are stored as Adelaide local time but sent with +00:00, so read
// the HH:MM characters directly to avoid browser-timezone conversion.
function formatTime(iso: string): string {
    return iso.substring(11, 16);
}

function formatDateShort(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]} ${date.getDate()}`;
}

function formatDateFull(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-AU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

// ─── Breadcrumbs ─────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Map', href: '/map' }];

// ─── Component ───────────────────────────────────────────────────────────────

export default function MapIndex({ markers, selectedDate, availableDates }: MapIndexProps) {
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
    const selectedDateRef = useRef<HTMLButtonElement>(null);

    // Build a single GeoJSON FeatureCollection from all events that have routes
    const routeCollection = useMemo<GeoJSON.FeatureCollection>(() => {
        const features: GeoJSON.Feature[] = markers.flatMap((marker) =>
            marker.events
                .filter((e) => e.route_geojson !== null)
                .flatMap((e) =>
                    (e.route_geojson!.features ?? []).map((f) => ({
                        ...f,
                        properties: {
                            ...f.properties,
                            event_id: e.id,
                            color: CATEGORY_LINE_COLORS[e.category_slug] ?? CATEGORY_LINE_COLORS['other'],
                        },
                    })),
                ),
        );
        return { type: 'FeatureCollection', features };
    }, [markers]);

    const currentDateIndex = availableDates.indexOf(selectedDate);
    const hasPrevDate = currentDateIndex > 0;
    const hasNextDate = currentDateIndex < availableDates.length - 1;

    useEffect(() => {
        selectedDateRef.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }, [selectedDate]);

    // Clear panel when the date changes
    useEffect(() => {
        setSelectedMarker(null);
    }, [selectedDate]);

    const navigateToDate = useCallback((date: string) => {
        router.get('/map', { date }, { preserveState: true });
    }, []);

    const goToPrevDate = () => {
        if (hasPrevDate) navigateToDate(availableDates[currentDateIndex - 1]);
    };

    const goToNextDate = () => {
        if (hasNextDate) navigateToDate(availableDates[currentDateIndex + 1]);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Map | TDU Planner" />

            <div className="flex h-[calc(100dvh-4rem)] flex-col">
                {/* Header — matches schedule page style */}
                <div className="shrink-0 border-b bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-3 text-white sm:px-4 sm:py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-bold sm:text-2xl">Map</h1>
                        <Link href="/schedule">
                            <Button variant="secondary" size="sm">
                                <MapPin className="size-4 sm:mr-2" />
                                <span className="hidden sm:inline">Schedule View</span>
                            </Button>
                        </Link>
                    </div>

                    {/* Date navigation */}
                    <div className="mt-2 flex items-center gap-1 sm:mt-3 sm:gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-white hover:bg-white/20 sm:size-10"
                            onClick={goToPrevDate}
                            disabled={!hasPrevDate}
                        >
                            <ChevronLeft className="size-4 sm:size-5" />
                        </Button>

                        <div className="scrollbar-none flex flex-1 justify-center gap-1 overflow-x-auto">
                            {availableDates.map((date) => (
                                <button
                                    key={date}
                                    ref={date === selectedDate ? selectedDateRef : undefined}
                                    onClick={() => navigateToDate(date)}
                                    className={cn(
                                        'shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all sm:px-4 sm:py-2 sm:text-sm',
                                        date === selectedDate
                                            ? 'bg-white text-orange-600 shadow-md'
                                            : 'text-white/90 hover:bg-white/20',
                                    )}
                                >
                                    {formatDateShort(date)}
                                </button>
                            ))}
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-white hover:bg-white/20 sm:size-10"
                            onClick={goToNextDate}
                            disabled={!hasNextDate}
                        >
                            <ChevronRight className="size-4 sm:size-5" />
                        </Button>
                    </div>

                    <p className="mt-1 text-center text-xs text-white/80 sm:mt-2 sm:text-sm">
                        {formatDateFull(selectedDate)}
                    </p>
                </div>

                {/* Map + panel */}
                <div className="relative min-h-0 flex-1">
                    {MAPTILER_KEY ? (
                        <Map
                            initialViewState={DEFAULT_VIEW}
                            style={{ width: '100%', height: '100%' }}
                            mapStyle={MAP_STYLE}
                        >
                            {/* Route polylines — rendered below markers */}
                            {routeCollection.features.length > 0 && (
                                <Source id="routes" type="geojson" data={routeCollection}>
                                    <Layer
                                        id="route-lines-casing"
                                        type="line"
                                        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                                        paint={{ 'line-color': '#ffffff', 'line-width': 5, 'line-opacity': 0.6 }}
                                    />
                                    <Layer
                                        id="route-lines"
                                        type="line"
                                        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                                        paint={{ 'line-color': ['get', 'color'], 'line-width': 3, 'line-opacity': 0.85 }}
                                    />
                                </Source>
                            )}

                            {markers.map((marker) => (
                                <Marker
                                    key={marker.location_id}
                                    longitude={marker.longitude}
                                    latitude={marker.latitude}
                                    anchor="bottom"
                                    onClick={(e) => {
                                        e.originalEvent.stopPropagation();
                                        setSelectedMarker(
                                            selectedMarker?.location_id === marker.location_id
                                                ? null
                                                : marker,
                                        );
                                    }}
                                >
                                    <MarkerPin
                                        marker={marker}
                                        isSelected={selectedMarker?.location_id === marker.location_id}
                                    />
                                </Marker>
                            ))}
                        </Map>
                    ) : (
                        <div className="flex h-full items-center justify-center bg-muted/30">
                            <div className="text-center">
                                <MapPin className="mx-auto mb-3 size-10 text-muted-foreground/40" />
                                <p className="font-medium">Map key not configured</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Add <code className="rounded bg-muted px-1">VITE_MAPTILER_KEY</code> to your{' '}
                                    <code className="rounded bg-muted px-1">.env</code> file.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Event detail panel */}
                    {selectedMarker && (
                        <EventPanel marker={selectedMarker} onClose={() => setSelectedMarker(null)} />
                    )}

                    {/* No events message */}
                    {markers.length === 0 && MAPTILER_KEY && (
                        <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-8">
                            <div className="rounded-lg bg-white/90 px-4 py-3 shadow-md dark:bg-gray-800/90">
                                <p className="text-sm font-medium">No events with locations on this day</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

// ─── Marker pin ───────────────────────────────────────────────────────────────

function MarkerPin({ marker, isSelected }: { marker: MapMarker; isSelected: boolean }) {
    const primarySlug = marker.events[0]?.category_slug ?? 'other';
    const color = getCategoryColor(primarySlug);
    const count = marker.events.length;

    return (
        <div className="flex cursor-pointer flex-col items-center">
            <div
                className={cn(
                    'flex min-w-[32px] items-center justify-center rounded-full px-2 py-1 text-xs font-bold text-white shadow-lg ring-2 transition-transform',
                    color,
                    isSelected ? 'scale-110 ring-white' : 'ring-white/60 hover:scale-105',
                )}
            >
                {count > 1 ? count : <MapPin className="size-3.5" />}
            </div>
            {/* Pointer triangle */}
            <div
                className={cn('size-0 border-x-4 border-t-8 border-x-transparent', {
                    'border-t-blue-600':   primarySlug === 'race-stages',
                    'border-t-violet-600': primarySlug === 'official-events',
                    'border-t-sky-500':    primarySlug === 'watch-parties',
                    'border-t-orange-500': primarySlug === 'group-rides',
                    'border-t-purple-500': primarySlug === 'local-racing',
                    'border-t-rose-400':   primarySlug === 'pop-up',
                    'border-t-teal-500':   primarySlug === 'expo',
                    'border-t-cyan-500':   primarySlug === 'pop-ups',
                    'border-t-indigo-500': primarySlug === 'team-meets',
                    'border-t-amber-500':  primarySlug === 'food-wine',
                    'border-t-pink-500':   primarySlug === 'entertainment',
                    'border-t-lime-600':   primarySlug === 'podcast',
                    'border-t-gray-500':   !CATEGORY_COLORS[primarySlug],
                })}
            />
        </div>
    );
}

// ─── Event detail panel ───────────────────────────────────────────────────────

function EventPanel({ marker, onClose }: { marker: MapMarker; onClose: () => void }) {
    return (
        <div className="absolute right-0 top-0 flex h-full w-80 flex-col border-l bg-background shadow-xl sm:w-96">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Location</p>
                    <h2 className="font-semibold">{marker.location_name}</h2>
                </div>
                <button
                    onClick={onClose}
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <X className="size-4" />
                </button>
            </div>

            {/* Event list */}
            <div className="flex-1 overflow-y-auto">
                {marker.events.map((event) => (
                    <EventCard key={event.id} event={event} />
                ))}
            </div>
        </div>
    );
}

function EventCard({ event }: { event: MapEvent }) {
    const color = getCategoryColor(event.category_slug);
    const timeLabel = `${formatTime(event.start_datetime)} – ${formatTime(event.end_datetime)}`;

    return (
        <div className="border-b px-4 py-3 last:border-0">
            <div className="flex items-start gap-3">
                <div className={cn('mt-0.5 size-2.5 shrink-0 rounded-full', color)} />
                <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{event.category_name}</p>
                    <p className="font-medium leading-snug">{event.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{timeLabel}</p>
                    {event.ride_distance_km && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{event.ride_distance_km} km</p>
                    )}
                </div>
                {event.url && (
                    <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                        <ExternalLink className="size-4" />
                    </a>
                )}
            </div>
            <div className="mt-2 pl-5">
                <Link
                    href={`/events/${event.id}`}
                    className="text-xs font-medium text-orange-600 hover:underline dark:text-orange-400"
                >
                    View details →
                </Link>
            </div>
        </div>
    );
}
