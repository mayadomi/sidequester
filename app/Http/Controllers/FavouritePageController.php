<?php

namespace App\Http\Controllers;

use App\Http\Resources\EventResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FavouritePageController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $events = $user->favouriteEvents()
            ->with([
                'category',
                'sponsor.media',
                'location',
                'tags',
                'favouritedBy' => fn ($q) => $q->where('users.id', $user->id),
            ])
            ->withCount('favouritedBy')
            ->orderBy('start_datetime')
            ->get();

        $eventData = EventResource::collection($events)->resolve();

        // Build map markers grouped by location (only events that have a location)
        $markers = $events
            ->filter(fn ($event) => $event->location !== null)
            ->groupBy('location_id')
            ->map(function ($locationEvents) {
                $location = $locationEvents->first()->location;

                return [
                    'location_id' => $location->id,
                    'location_name' => $location->name,
                    'latitude' => (float) $location->latitude,
                    'longitude' => (float) $location->longitude,
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
                        'sponsor_logo_url' => $event->sponsor?->getFirstMediaUrl('logo_square', 'display') ?: null,
                        'sponsor_logo_dark_url' => $event->sponsor?->getFirstMediaUrl('logo_square_dark', 'display') ?: null,
                        'is_favourited' => true,
                        'route_geojson' => $event->route_geojson,
                    ])->values()->toArray(),
                ];
            })
            ->values()
            ->toArray();

        return Inertia::render('favourites/index', [
            'events' => $eventData,
            'markers' => $markers,
        ]);
    }
}
