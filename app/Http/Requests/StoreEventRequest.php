<?php

namespace App\Http\Requests;

use App\Models\Category;
use App\Rules\ValidGpxFile;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

class StoreEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\Event::class) ?? false;
    }

    public function rules(): array
    {
        $groupRide = $this->isGroupRideCategory();

        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_datetime' => ['required', 'date'],
            'end_datetime' => ['required', 'date', 'after:start_datetime'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'sponsor_id' => [
                'nullable',
                'integer',
                'exists:sponsors,id',
                function (string $attribute, mixed $value, Closure $fail): void {
                    $user = $this->user();
                    if ($value === null || $user->isAdmin()) {
                        return;
                    }
                    $isVerified = $user->verifiedSponsors()
                        ->where('sponsors.id', $value)
                        ->exists();
                    if (! $isVerified) {
                        $fail('You may only create events for sponsors you are verified with.');
                    }
                },
            ],
            'location_name' => ['nullable', 'string', 'max:255'],
            'location_address' => ['nullable', 'string', 'max:500'],
            'location_lat' => ['nullable', 'numeric', 'between:-90,90', 'required_with:location_lng'],
            'location_lng' => ['nullable', 'numeric', 'between:-180,180', 'required_with:location_lat'],
            'pace' => [$groupRide ? 'required' : 'nullable', 'string', 'max:100'],
            'ride_distance_km' => [$groupRide ? 'required' : 'nullable', 'numeric', 'min:0'],
            'elevation_gain_m' => [$groupRide ? 'required' : 'nullable', 'integer', 'min:0'],
            'route_url' => [$groupRide ? 'required' : 'nullable', 'url', 'max:500'],
            'url' => ['nullable', 'url', 'max:500'],
            'is_featured' => ['boolean'],
            'is_recurring' => ['boolean'],
            'is_womens' => ['boolean'],
            'is_free' => ['boolean'],
            'min_cost' => ['nullable', 'numeric', 'min:0'],
            'max_cost' => ['nullable', 'numeric', 'min:0', 'gte:min_cost'],
            'tag_ids' => ['nullable', 'array'],
            'tag_ids.*' => ['integer', 'exists:tags,id'],
            'gpx' => [$groupRide ? 'required' : 'nullable', 'file', 'max:10240', new ValidGpxFile],
            'route_geojson' => [$groupRide ? 'required' : 'nullable', 'required_with:gpx', 'string'],
            'banner' => ['nullable', 'image', 'max:5120', 'mimes:jpg,jpeg,png,webp,gif'],
        ];
    }

    private function isGroupRideCategory(): bool
    {
        $categoryId = $this->input('category_id');

        if (! $categoryId) {
            return false;
        }

        return Category::where('id', $categoryId)->value('slug') === 'group-rides';
    }
}
