<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait FiltersEvents
{
    /**
     * Filter keys that persist across Events / Schedule / Map pages via session.
     * Intentionally excludes search, sort, order, date ranges, and pagination.
     */
    protected function persistentFilterKeys(): array
    {
        return [
            'category', 'tags',
            'min_distance', 'max_distance',
            'min_elevation', 'max_elevation',
            'rides_only', 'featured', 'free',
            'recurring', 'womens',
            'min_cost', 'max_cost',
        ];
    }

    /**
     * Sync cross-page persistent filters with the session.
     *
     * - _clear=1  → wipe session, nothing merged
     * - filter params present → save to session
     * - no filter params → restore session values into request
     */
    protected function syncPersistentFilters(Request $request): void
    {
        if ($request->boolean('_clear')) {
            session()->forget('event_filters');

            return;
        }

        $keys = $this->persistentFilterKeys();

        if ($request->hasHeader('X-Filter-Applied')) {
            // Explicit filter interaction — persist whatever is currently active (may be empty).
            $active = array_filter(
                $request->only($keys),
                fn ($v) => $v !== null && $v !== '' && $v !== false && $v !== [] && $v !== '0',
            );
            session(['event_filters' => $active]);
        } else {
            // Direct/bookmarked URL — restore any previously saved filters.
            $request->mergeIfMissing(session('event_filters', []));
        }
    }

    /**
     * Apply request filters to an Event query.
     */
    protected function applyEventFilters(Builder $query, Request $request): void
    {
        $this->syncPersistentFilters($request);

        // Search
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        // Date filters
        if ($request->has('date')) {
            $query->onDate($request->date);
        } elseif ($request->has('start_date')) {
            $query->betweenDates($request->start_date, $request->end_date);
        }

        // Category filter
        if ($request->has('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->category));
        }

        // Sponsor filter
        if ($request->has('sponsor')) {
            $query->whereHas('sponsor', fn ($q) => $q->where('slug', $request->sponsor));
        }

        // Ride distance filters
        if ($request->has('min_distance')) {
            $query->minDistance((float) $request->min_distance);
        }
        if ($request->has('max_distance')) {
            $query->maxDistance((float) $request->max_distance);
        }

        // Elevation filters
        if ($request->has('min_elevation')) {
            $query->minElevation((int) $request->min_elevation);
        }
        if ($request->has('max_elevation')) {
            $query->maxElevation((int) $request->max_elevation);
        }

        // Boolean filters
        if ($request->boolean('rides_only')) {
            $query->rides();
        }
        if ($request->boolean('featured')) {
            $query->featured();
        }
        if ($request->boolean('free')) {
            $query->free();
        }
        if ($request->boolean('recurring')) {
            $query->recurring();
        }
        if ($request->boolean('womens')) {
            $query->womens();
        }

        // Cost filters
        if ($request->has('min_cost')) {
            $query->minCost((float) $request->min_cost);
        }
        if ($request->has('max_cost')) {
            $query->maxCost((float) $request->max_cost);
        }

        // Tags filter
        if ($request->has('tags')) {
            $slugs = is_array($request->tags) ? $request->tags : explode(',', $request->tags);
            $query->withTags(array_filter($slugs));
        }

        // Popularity filter
        if ($request->has('min_favourites')) {
            $query->minFavourites((int) $request->min_favourites);
        }
    }

    /**
     * Apply sorting to an Event query.
     */
    protected function applyEventSorting(Builder $query, string $sortField, string $sortOrder): void
    {
        $direction = $sortOrder === 'desc' ? 'desc' : 'asc';

        switch ($sortField) {
            case 'popularity':
                $query->orderBy('favourited_by_count', $direction);
                break;
            case 'cost':
                $query->orderBy('is_free', 'desc')
                    ->orderByRaw('COALESCE(min_cost, max_cost) '.$direction);
                break;
            case 'distance':
                $query->orderByRaw('ride_distance_km IS NULL')
                    ->orderBy('ride_distance_km', $direction);
                break;
            case 'elevation':
                $query->orderByRaw('elevation_gain_m IS NULL')
                    ->orderBy('elevation_gain_m', $direction);
                break;
            case 'date':
            default:
                $query->orderBy('start_datetime', $direction);
                break;
        }
    }
}
