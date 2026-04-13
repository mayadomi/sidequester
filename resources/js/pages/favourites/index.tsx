import { Head, Link, usePage } from '@inertiajs/react';
import { Clock, ExternalLink, Heart, List, Map as MapIcon, MapPin, Mountain, Route, X } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layer, Map as MapGL, Marker, Popup, Source } from 'react-map-gl/maplibre';

import { EventCard } from '@/components/events';
import { FavouriteButton } from '@/components/events/favourite-button';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Event } from '@/types/events';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FavMapEvent {
    id: number;
    title: string;
    start_datetime: string;
    end_datetime: string;
    category_slug: string;
    category_name: string;
    url: string | null;
    ride_distance_km: number | null;
    elevation_gain_m: number | null;
    is_featured: boolean;
    sponsor_logo_url: string | null;
    sponsor_logo_dark_url: string | null;
    is_favourited: boolean;
    route_geojson: GeoJSON.FeatureCollection | null;
}

interface FavMarker {
    location_name: string;
    latitude: number;
    longitude: number;
    events: FavMapEvent[];
}

interface FavouritesIndexProps {
    events: Event[];
    markers: FavMarker[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string | undefined;
const MAP_STYLE_LIGHT = `https://api.maptiler.com/maps/019d2f2b-b1d3-7ba1-8984-4301aab9b7f8/style.json?key=${MAPTILER_KEY ?? ''}`;
const MAP_STYLE_DARK  = `https://api.maptiler.com/maps/019d3df5-9af4-73ae-a327-71e87f370058/style.json?key=${MAPTILER_KEY ?? ''}`;

const DEFAULT_VIEW = { longitude: 138.5999, latitude: -34.9281, zoom: 10 };

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

function getCategoryBg(slug: string): string {
    return CATEGORY_COLORS[slug] ?? CATEGORY_COLORS['other'];
}

function formatTime(iso: string): string {
    return iso.substring(11, 16);
}

// ─── Breadcrumbs ─────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [{ title: 'My Favourites', href: '/favourites' }];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FavouritesIndex({ events, markers }: FavouritesIndexProps) {
    const { name } = usePage<SharedData>().props;
    const [view, setView] = useState<'list' | 'map'>('list');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`My Favourites | ${name}`} />

            <div className="flex min-h-0 flex-1 flex-col">
                {/* Header */}
                <div className="shrink-0 border-b px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">My Favourites</h1>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {events.length} saved event{events.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        {events.length > 0 && (
                            <div className="flex rounded-lg border p-1">
                                <button
                                    onClick={() => setView('list')}
                                    className={cn(
                                        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                        view === 'list'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <List className="size-4" />
                                    List
                                </button>
                                <button
                                    onClick={() => setView('map')}
                                    className={cn(
                                        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                        view === 'map'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <MapIcon className="size-4" />
                                    Map
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                {events.length === 0 ? (
                    <EmptyState />
                ) : view === 'list' ? (
                    <ListView events={events} />
                ) : (
                    <MapView markers={markers} />
                )}
            </div>
        </AppLayout>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <Heart className="size-8 text-muted-foreground/50" />
            </div>
            <div>
                <h3 className="text-lg font-medium">No saved events yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Tap the heart icon on any event to save it here.
                </p>
            </div>
            <Button asChild>
                <Link href="/events">Browse events</Link>
            </Button>
        </div>
    );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({ events }: { events: Event[] }) {
    return (
        <div className="flex-1 overflow-y-auto">
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-6 xl:grid-cols-3">
                {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                ))}
            </div>
        </div>
    );
}

// ─── Map view ─────────────────────────────────────────────────────────────────

function MapView({ markers }: { markers: FavMarker[] }) {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    const [selectedMarker, setSelectedMarker] = useState<FavMarker | null>(null);
    const [routeEvents, setRouteEvents] = useState<FavMapEvent[]>([]);
    const [routePopupLngLat, setRoutePopupLngLat] = useState<{ longitude: number; latitude: number } | null>(null);
    const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string>('auto');

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const routeCollection = useMemo<GeoJSON.FeatureCollection>(() => {
        const features: GeoJSON.Feature[] = markers.flatMap((marker) =>
            marker.events
                .filter((e) => e.route_geojson !== null)
                .flatMap((e) =>
                    (e.route_geojson!.features ?? []).map((f) => ({
                        ...f,
                        properties: {
                            ...f.properties,
                            event_id: String(e.id),
                            color: CATEGORY_LINE_COLORS[e.category_slug] ?? CATEGORY_LINE_COLORS['other'],
                        },
                    })),
                ),
        );
        return { type: 'FeatureCollection', features };
    }, [markers]);

    // Fast event_id → FavMapEvent lookup for line-click handling
    const eventIdToEvent = useMemo(() => {
        const map = new globalThis.Map<number, FavMapEvent>();
        for (const marker of markers) {
            for (const event of marker.events) {
                map.set(event.id, event);
            }
        }
        return map;
    }, [markers]);

    const handleMapClick = useCallback(
        (e: MapLayerMouseEvent) => {
            const TOLERANCE = 6;
            const bbox = [
                [e.point.x - TOLERANCE, e.point.y - TOLERANCE],
                [e.point.x + TOLERANCE, e.point.y + TOLERANCE],
            ] as [[number, number], [number, number]];

            const features = e.target.queryRenderedFeatures(bbox, { layers: ['route-lines'] });

            const seen = new globalThis.Set<number>();
            const events: FavMapEvent[] = [];
            for (const f of features) {
                const eventId = f.properties?.event_id != null ? Number(f.properties.event_id) : undefined;
                if (eventId !== undefined && !seen.has(eventId)) {
                    seen.add(eventId);
                    const event = eventIdToEvent.get(eventId);
                    if (event) events.push(event);
                }
            }

            setSelectedMarker(null);

            if (events.length > 0) {
                setRoutePopupLngLat({ longitude: e.lngLat.lng, latitude: e.lngLat.lat });
            } else {
                setRoutePopupLngLat(null);
            }

            setRouteEvents((prev) => {
                if (events.length === 0) return [];
                const sameSelection =
                    prev.length === events.length && events.every((ev) => prev.some((p) => p.id === ev.id));
                return sameSelection ? [] : events;
            });
        },
        [eventIdToEvent],
    );

    const handleMarkerClick = (marker: FavMarker) => {
        setRouteEvents([]);
        setRoutePopupLngLat(null);
        setSelectedMarker((prev) => (prev?.location_name === marker.location_name ? null : marker));
    };

    const markerSubtitle = useMemo(() => {
        if (!selectedMarker) return '';
        const unique = [...new Set(selectedMarker.events.map((e) => e.category_name))];
        return unique.length === 1 ? unique[0] : 'Multiple categories';
    }, [selectedMarker]);

    const routeSubtitle = useMemo(() => {
        if (!routeEvents.length) return '';
        const unique = [...new Set(routeEvents.map((e) => e.category_name))];
        return unique.length === 1 ? unique[0] : 'Multiple categories';
    }, [routeEvents]);

    const POPUP_CLASS =
        '[&_.maplibregl-popup-content]:!bg-transparent [&_.maplibregl-popup-content]:!p-0 [&_.maplibregl-popup-content]:!shadow-none [&_.maplibregl-popup-tip]:!hidden';

    return (
        <div className="min-h-0 flex-1 overflow-hidden">
            <MapGL
                initialViewState={DEFAULT_VIEW}
                minZoom={8}
                mapStyle={isDark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT}
                style={{ width: '100%', height: '100%' }}
                interactiveLayerIds={['route-lines', 'route-lines-casing']}
                cursor={cursor}
                onClick={handleMapClick}
                onMouseMove={(e) => setCursor(e.features?.length ? 'pointer' : 'auto')}
            >
                {/* Route polylines — rendered below markers */}
                {routeCollection.features.length > 0 && (
                    <Source id="routes" type="geojson" data={routeCollection}>
                        <Layer
                            id="route-lines-casing"
                            type="line"
                            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                            paint={{
                                'line-color': '#ffffff',
                                'line-width': 5,
                                'line-opacity': isDark ? 0 : 0.6,
                            }}
                        />
                        <Layer
                            id="route-lines"
                            type="line"
                            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                            paint={{
                                'line-color': ['get', 'color'],
                                'line-width': 3,
                                'line-opacity': 0.85,
                            }}
                        />
                    </Source>
                )}

                {markers.map((marker) => (
                    <Marker
                        key={marker.location_name}
                        longitude={marker.longitude}
                        latitude={marker.latitude}
                        anchor="bottom"
                        onClick={(e) => {
                            e.originalEvent.stopPropagation();
                            handleMarkerClick(marker);
                        }}
                    >
                        <MarkerPin
                            marker={marker}
                            isSelected={selectedMarker?.location_name === marker.location_name}
                            isHovered={hoveredMarkerId === marker.location_name}
                            onMouseEnter={() => setHoveredMarkerId(marker.location_name)}
                            onMouseLeave={() => setHoveredMarkerId(null)}
                        />
                    </Marker>
                ))}

                {/* Marker popup */}
                {selectedMarker && (
                    <Popup
                        longitude={selectedMarker.longitude}
                        latitude={selectedMarker.latitude}
                        anchor="bottom"
                        offset={32}
                        closeButton={false}
                        closeOnClick={false}
                        maxWidth="min(320px, calc(100vw - 32px))"
                        className={POPUP_CLASS}
                    >
                        <PopupCard
                            title={selectedMarker.location_name}
                            subtitle={markerSubtitle}
                            events={selectedMarker.events}
                            onClose={() => setSelectedMarker(null)}
                            showHeader={selectedMarker.events.length > 1}
                        />
                    </Popup>
                )}

                {/* Route popup */}
                {routeEvents.length > 0 && routePopupLngLat && (
                    <Popup
                        longitude={routePopupLngLat.longitude}
                        latitude={routePopupLngLat.latitude}
                        anchor="bottom"
                        offset={16}
                        closeButton={false}
                        closeOnClick={false}
                        maxWidth="min(320px, calc(100vw - 32px))"
                        className={POPUP_CLASS}
                    >
                        <PopupCard
                            title={
                                routeEvents.length === 1
                                    ? routeEvents[0].title
                                    : `${routeEvents.length} results found`
                            }
                            subtitle={routeSubtitle}
                            events={routeEvents}
                            onClose={() => { setRouteEvents([]); setRoutePopupLngLat(null); }}
                            showHeader={routeEvents.length > 1}
                        />
                    </Popup>
                )}
            </MapGL>
        </div>
    );
}

// ─── Marker pin ───────────────────────────────────────────────────────────────

function MarkerPin({
    marker,
    isSelected,
    isHovered,
    onMouseEnter,
    onMouseLeave,
}: {
    marker: FavMarker;
    isSelected: boolean;
    isHovered: boolean;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}) {
    const primarySlug = marker.events[0]?.category_slug ?? 'other';
    const color = getCategoryBg(primarySlug);
    const count = marker.events.length;

    return (
        <div
            className="flex cursor-pointer flex-col items-center"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div
                className={cn(
                    'flex min-w-[32px] items-center justify-center rounded-full px-2 py-1 text-xs font-bold text-white shadow-lg ring-2 transition-transform',
                    color,
                    isSelected || isHovered ? 'scale-110 ring-white' : 'ring-white/60 hover:scale-105',
                )}
            >
                {count > 1 ? count : <MapPin className="size-3.5" />}
            </div>
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

// ─── Popup card ───────────────────────────────────────────────────────────────

function PopupCard({
    title,
    subtitle,
    events,
    onClose,
    showHeader,
}: {
    title: string;
    subtitle: string;
    events: FavMapEvent[];
    onClose: () => void;
    showHeader: boolean;
}) {
    return (
        <div className="relative flex max-h-80 w-full flex-col overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/8 dark:bg-zinc-900 dark:ring-white/10">
            {showHeader && (
                <div className="flex shrink-0 items-center justify-between border-b px-3 py-2.5">
                    <div className="min-w-0 pr-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {subtitle}
                        </p>
                        <p className="truncate text-sm font-semibold leading-snug">{title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Close"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            )}
            <div className="flex-1 overflow-y-auto">
                {events.map((event, i) => (
                    <PopupEventCard
                        key={event.id}
                        event={event}
                        onClose={!showHeader && i === 0 ? onClose : undefined}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Popup event card ─────────────────────────────────────────────────────────

function PopupEventCard({
    event,
    onClose,
}: {
    event: FavMapEvent;
    onClose?: () => void;
}) {
    const hexColor = CATEGORY_LINE_COLORS[event.category_slug] ?? CATEGORY_LINE_COLORS['other'];

    return (
        <div className="flex border-b last:border-0">
            {/* Left: sponsor logo */}
            <div className="flex w-16 shrink-0 items-center justify-center">
                {event.sponsor_logo_url && (
                    <>
                        <img src={event.sponsor_logo_url} alt="" className="size-12 object-contain p-1 dark:hidden" />
                        <img
                            src={event.sponsor_logo_dark_url ?? event.sponsor_logo_url}
                            alt=""
                            className="hidden size-12 object-contain p-1 dark:block"
                        />
                    </>
                )}
            </div>

            {/* Centre: content */}
            <div className="min-w-0 flex-1 py-2.5 pr-2.5">
                <Link
                    href={`/events/${event.id}`}
                    className="block text-sm font-medium leading-snug hover:underline"
                >
                    {event.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatTime(event.start_datetime)} – {formatTime(event.end_datetime)}
                    </span>
                    {event.ride_distance_km && (
                        <span className="flex items-center gap-1">
                            <Route className="size-3" />
                            {event.ride_distance_km} km
                        </span>
                    )}
                    {event.elevation_gain_m && (
                        <span className="flex items-center gap-1">
                            <Mountain className="size-3" />
                            {event.elevation_gain_m} m
                        </span>
                    )}
                </div>
            </div>

            {/* Right: action panel */}
            <div className="flex w-10 shrink-0 flex-col" style={{ backgroundColor: hexColor }}>
                {onClose && (
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="flex flex-1 items-center justify-center hover:brightness-90"
                    >
                        <X className="size-4 stroke-[2.5] text-white" />
                    </button>
                )}
                <div className="flex flex-1 items-center justify-center">
                    <FavouriteButton
                        eventId={event.id}
                        isFavourited={event.is_favourited}
                        className="border-0 bg-transparent text-white shadow-none hover:bg-white/20 hover:text-white"
                    />
                </div>
                {event.url && (
                    <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center hover:brightness-90"
                    >
                        <ExternalLink className="size-5 stroke-[2.5] text-white" />
                    </a>
                )}
            </div>
        </div>
    );
}
