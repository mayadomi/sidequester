<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\FiltersEvents;
use App\Models\Category;
use App\Models\Event;
use App\Models\Tag;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MapController extends Controller
{
    use FiltersEvents;

    private const DISPLAY_TZ = 'Australia/Adelaide';

    public function index(Request $request): Response
    {
        $dateRange = $this->getEventDateRange();

        $selectedDate = $request->input('date')
            ? Carbon::parse($request->input('date'), self::DISPLAY_TZ)->startOfDay()
            : ($dateRange['start'] ?? Carbon::now(self::DISPLAY_TZ)->startOfDay());

        $query = Event::with(['category', 'sponsor.media'])
            ->withDerivedRouteGeojson()
            ->whereDate('start_datetime', $selectedDate)
            ->whereNotNull('location_lat');

        $this->applyEventFilters($query, $request);

        $events = $query->orderBy('start_datetime')->get();

        $categories = Category::withCount('events')->orderBy('name')->get(['id', 'name', 'slug']);
        $tags = Tag::withCount('events')->orderBy('name')->get(['id', 'name', 'slug']);
        $currentFilters = $request->only([
            'search', 'category', 'tags', 'min_distance', 'max_distance',
            'min_elevation', 'max_elevation', 'rides_only', 'featured', 'free',
            'recurring', 'womens', 'min_cost', 'max_cost',
        ]);

        $availableDates = Event::selectRaw('DATE(start_datetime) as date')
            ->distinct()
            ->orderBy('date')
            ->pluck('date')
            ->map(fn ($date) => Carbon::parse($date)->format('Y-m-d'))
            ->toArray();

        // Fetch the authenticated user's favourite event IDs in one query
        $user = $request->user();
        $favouriteEventIds = $user
            ? $user->favourites()->pluck('event_id')->flip()->all()
            : [];

        // Group events by location so each pin can show multiple events
        $markers = $events
            ->groupBy('location_name')
            ->map(function ($locationEvents) use ($favouriteEventIds) {
                $first = $locationEvents->first();

                return [
                    'location_name' => $first->location_name,
                    'latitude' => (float) $first->location_lat,
                    'longitude' => (float) $first->location_lng,
                    'events' => $locationEvents->map(fn ($event) => [
                        'id' => $event->id,
                        'title' => $event->title,
                        'start_datetime' => $event->start_datetime->toIso8601String(),
                        'end_datetime' => $event->end_datetime->toIso8601String(),
                        'category_slug' => $event->category?->slug ?? 'other',
                        'category_name' => $event->category?->name ?? 'Other',
                        'url' => $event->url,
                        'ride_distance_km' => $event->ride_distance_km,
                        'elevation_gain_m' => $event->elevation_gain_m,
                        'is_featured' => $event->is_featured,
                        'route_geojson' => $event->route_feature_collection,
                        'sponsor_logo_url' => $event->sponsor?->getFirstMediaUrl('logo_square', 'display') ?: null,
                        'sponsor_logo_dark_url' => $event->sponsor?->getFirstMediaUrl('logo_square_dark', 'display') ?: null,
                        'is_favourited' => isset($favouriteEventIds[$event->id]),
                    ])->values()->toArray(),
                ];
            })
            ->values()
            ->toArray();

        return Inertia::render('map/index', [
            'markers' => $markers,
            'selectedDate' => $selectedDate->format('Y-m-d'),
            'availableDates' => $availableDates,
            'categories' => $categories,
            'tags' => $tags,
            'filters' => (object) $currentFilters,
        ]);
    }

    private function getEventDateRange(): array
    {
        $firstEvent = Event::orderBy('start_datetime')->first();
        $lastEvent = Event::orderBy('start_datetime', 'desc')->first();

        return [
            'start' => $firstEvent?->start_datetime?->startOfDay(),
            'end' => $lastEvent?->start_datetime?->startOfDay(),
        ];
    }
}
