<?php

namespace App\Http\Requests;

use App\Models\Category;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

class UpdateEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('event')) ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_datetime' => ['required', 'date'],
            'end_datetime' => ['required', 'date', 'after:start_datetime'],
            'category_id' => [
                'required', 'integer', 'exists:categories,id',
                function (string $attribute, mixed $value, Closure $fail): void {
                    $user = $this->user();
                    if ($user->isAdmin() || $user->isTduEditor()) {
                        return;
                    }
                    $slug = Category::where('id', $value)->value('slug');
                    if (in_array($slug, config('tdu.restricted_category_slugs', []))) {
                        $fail('You do not have permission to use this category.');
                    }
                },
            ],
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
                        $fail('You may only update events for sponsors you are verified with.');
                    }
                },
            ],
            'pace' => ['nullable', 'string', 'max:100'],
            'route_url' => ['nullable', 'url', 'max:500'],
            'url' => ['nullable', 'url', 'max:500'],
            'is_race_stage' => ['boolean'],
            'is_recurring' => ['boolean'],
            'is_womens' => ['boolean'],
            'is_free' => ['boolean'],
            'min_cost' => ['nullable', 'numeric', 'min:0'],
            'max_cost' => ['nullable', 'numeric', 'min:0', 'gte:min_cost'],
            'ride_distance_km' => ['nullable', 'numeric', 'min:0'],
            'elevation_gain_m' => ['nullable', 'integer', 'min:0'],
            'location_name' => ['nullable', 'string', 'max:255'],
            'location_address' => ['nullable', 'string', 'max:500'],
            'location_lat' => ['nullable', 'numeric', 'between:-90,90', 'required_with:location_lng'],
            'location_lng' => ['nullable', 'numeric', 'between:-180,180', 'required_with:location_lat'],
            'tag_ids' => ['nullable', 'array'],
            'tag_ids.*' => ['integer', 'exists:tags,id'],
        ];
    }
}
