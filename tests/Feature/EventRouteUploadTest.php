<?php

use App\Models\Event;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

// Minimal valid GPX XML
$minimalGpx = <<<'GPX'
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test">
  <trk><name>Test Route</name><trkseg>
    <trkpt lat="-34.9285" lon="138.6007"><ele>50</ele></trkpt>
    <trkpt lat="-34.9300" lon="138.6100"><ele>55</ele></trkpt>
  </trkseg></trk>
</gpx>
GPX;

// Minimal GeoJSON FeatureCollection (as client-side @tmcw/togeojson would produce)
$minimalGeojson = json_encode([
    'type' => 'FeatureCollection',
    'features' => [[
        'type' => 'Feature',
        'geometry' => [
            'type' => 'LineString',
            'coordinates' => [[138.6007, -34.9285], [138.6100, -34.9300]],
        ],
        'properties' => ['name' => 'Test Route'],
    ]],
]);

function makeEditor(): User
{
    return User::factory()->create(['role' => 'editor']);
}

function makeEvent(User $editor): Event
{
    return Event::factory()->create(['created_by_user_id' => $editor->id]);
}

// ─── Upload ───────────────────────────────────────────────────────────────────

it('allows an editor to upload a GPX route for their own event', function () use ($minimalGpx, $minimalGeojson) {
    Storage::fake('public');

    $editor = makeEditor();
    $event = makeEvent($editor);

    $response = $this->actingAs($editor)->post("/events/{$event->id}/route", [
        'gpx' => UploadedFile::fake()->createWithContent('route.gpx', $minimalGpx),
        'route_geojson' => $minimalGeojson,
    ]);

    $response->assertRedirect();

    $event->refresh();
    expect($event->route_geojson)->toBeArray()
        ->and($event->route_geojson['type'])->toBe('FeatureCollection')
        ->and($event->hasMedia('route_gpx'))->toBeTrue();
});

it('stores the decoded GeoJSON on the event', function () use ($minimalGpx, $minimalGeojson) {
    Storage::fake('public');

    $editor = makeEditor();
    $event = makeEvent($editor);

    $this->actingAs($editor)->post("/events/{$event->id}/route", [
        'gpx' => UploadedFile::fake()->createWithContent('route.gpx', $minimalGpx),
        'route_geojson' => $minimalGeojson,
    ]);

    $event->refresh();
    expect($event->route_geojson['features'])->toHaveCount(1)
        ->and($event->route_geojson['features'][0]['geometry']['type'])->toBe('LineString');
});

it('rejects upload when route_geojson is missing', function () use ($minimalGpx) {
    $editor = makeEditor();
    $event = makeEvent($editor);

    $response = $this->actingAs($editor)->post("/events/{$event->id}/route", [
        'gpx' => UploadedFile::fake()->createWithContent('route.gpx', $minimalGpx),
    ]);

    $response->assertSessionHasErrors('route_geojson');
});

it('rejects upload when GPX file is missing', function () use ($minimalGeojson) {
    $editor = makeEditor();
    $event = makeEvent($editor);

    $response = $this->actingAs($editor)->post("/events/{$event->id}/route", [
        'route_geojson' => $minimalGeojson,
    ]);

    $response->assertSessionHasErrors('gpx');
});

it('rejects upload when route_geojson is not valid JSON', function () use ($minimalGpx) {
    $editor = makeEditor();
    $event = makeEvent($editor);

    $response = $this->actingAs($editor)->post("/events/{$event->id}/route", [
        'gpx' => UploadedFile::fake()->createWithContent('route.gpx', $minimalGpx),
        'route_geojson' => 'not-json',
    ]);

    $response->assertSessionHasErrors('route_geojson');
});

it('forbids an editor from uploading a route to another editor\'s event', function () use ($minimalGpx, $minimalGeojson) {
    $owner = makeEditor();
    $other = makeEditor();
    $event = makeEvent($owner);

    $response = $this->actingAs($other)->post("/events/{$event->id}/route", [
        'gpx' => UploadedFile::fake()->createWithContent('route.gpx', $minimalGpx),
        'route_geojson' => $minimalGeojson,
    ]);

    $response->assertForbidden();
});

it('forbids unauthenticated users from uploading a route', function () use ($minimalGpx, $minimalGeojson) {
    $event = Event::factory()->create();

    $response = $this->post("/events/{$event->id}/route", [
        'gpx' => UploadedFile::fake()->createWithContent('route.gpx', $minimalGpx),
        'route_geojson' => $minimalGeojson,
    ]);

    $response->assertRedirect(route('login'));
});

// ─── Delete ───────────────────────────────────────────────────────────────────

it('allows an editor to delete the route from their own event', function () use ($minimalGpx, $minimalGeojson) {
    Storage::fake('public');

    $editor = makeEditor();
    $event = makeEvent($editor);

    // Upload first
    $this->actingAs($editor)->post("/events/{$event->id}/route", [
        'gpx' => UploadedFile::fake()->createWithContent('route.gpx', $minimalGpx),
        'route_geojson' => $minimalGeojson,
    ]);

    // Then delete
    $response = $this->actingAs($editor)->delete("/events/{$event->id}/route");
    $response->assertRedirect();

    $event->refresh();
    expect($event->route_geojson)->toBeNull()
        ->and($event->hasMedia('route_gpx'))->toBeFalse();
});

it('forbids an editor from deleting another editor\'s route', function () use ($minimalGpx, $minimalGeojson) {
    Storage::fake('public');

    $owner = makeEditor();
    $other = makeEditor();
    $event = makeEvent($owner);

    // Owner uploads
    $this->actingAs($owner)->post("/events/{$event->id}/route", [
        'gpx' => UploadedFile::fake()->createWithContent('route.gpx', $minimalGpx),
        'route_geojson' => $minimalGeojson,
    ]);

    // Other tries to delete
    $response = $this->actingAs($other)->delete("/events/{$event->id}/route");
    $response->assertForbidden();
});
