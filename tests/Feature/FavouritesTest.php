<?php

use App\Models\Event;
use App\Models\User;

// ── Favourites page access ────────────────────────────────────────────────────

test('guests are redirected to login from the favourites page', function () {
    $this->get(route('favourites.index'))->assertRedirect(route('login'));
});

test('authenticated users can access the favourites page', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('favourites.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('favourites/index'));
});

// ── Favourites page isolation ─────────────────────────────────────────────────

test('favourites page only shows the authenticated user\'s favourited events', function () {
    $alice = User::factory()->create();
    $bob   = User::factory()->create();

    $aliceEvent = Event::factory()->create();
    $bobEvent   = Event::factory()->create();

    $alice->favouriteEvents()->attach($aliceEvent->id);
    $bob->favouriteEvents()->attach($bobEvent->id);

    $this->actingAs($alice)
        ->get(route('favourites.index'))
        ->assertInertia(fn ($page) => $page
            ->component('favourites/index')
            ->has('events', 1)
            ->where('events.0.id', $aliceEvent->id)
        );
});

test('favourites page shows no events when user has no favourites', function () {
    $user  = User::factory()->create();
    $other = User::factory()->create();

    $otherEvent = Event::factory()->create();
    $other->favouriteEvents()->attach($otherEvent->id);

    $this->actingAs($user)
        ->get(route('favourites.index'))
        ->assertInertia(fn ($page) => $page
            ->component('favourites/index')
            ->has('events', 0)
        );
});

test('favourites page shows all of the user\'s favourited events', function () {
    $user = User::factory()->create();
    $events = Event::factory()->count(3)->create();
    $user->favouriteEvents()->attach($events->pluck('id'));

    $this->actingAs($user)
        ->get(route('favourites.index'))
        ->assertInertia(fn ($page) => $page
            ->component('favourites/index')
            ->has('events', 3)
        );
});

// ── API: GET /api/favourites ──────────────────────────────────────────────────

test('guests cannot access the favourites API', function () {
    $this->getJson('/api/favourites')->assertUnauthorized();
});

test('favourites API only returns the authenticated user\'s favourited events', function () {
    $alice = User::factory()->create();
    $bob   = User::factory()->create();

    $aliceEvent = Event::factory()->create();
    $bobEvent   = Event::factory()->create();

    $alice->favouriteEvents()->attach($aliceEvent->id);
    $bob->favouriteEvents()->attach($bobEvent->id);

    $this->actingAs($alice)
        ->getJson('/api/favourites')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $aliceEvent->id);
});

// ── API: POST /api/favourites/{event}/toggle ──────────────────────────────────

test('guests cannot toggle a favourite', function () {
    $event = Event::factory()->create();

    $this->postJson("/api/favourites/{$event->id}/toggle")->assertUnauthorized();
});

test('toggling adds an event to favourites', function () {
    $user  = User::factory()->create();
    $event = Event::factory()->create();

    $this->actingAs($user)
        ->postJson("/api/favourites/{$event->id}/toggle")
        ->assertOk()
        ->assertJsonPath('favourited', true);

    expect($user->hasFavourited($event))->toBeTrue();
});

test('toggling removes an already-favourited event', function () {
    $user  = User::factory()->create();
    $event = Event::factory()->create();

    $user->favouriteEvents()->attach($event->id);

    $this->actingAs($user)
        ->postJson("/api/favourites/{$event->id}/toggle")
        ->assertOk()
        ->assertJsonPath('favourited', false);

    expect($user->hasFavourited($event))->toBeFalse();
});

test('toggling one user\'s favourite does not affect another user\'s', function () {
    $alice = User::factory()->create();
    $bob   = User::factory()->create();
    $event = Event::factory()->create();

    $alice->favouriteEvents()->attach($event->id);
    $bob->favouriteEvents()->attach($event->id);

    // Alice unfavourites
    $this->actingAs($alice)
        ->postJson("/api/favourites/{$event->id}/toggle");

    expect($alice->hasFavourited($event))->toBeFalse();
    expect($bob->hasFavourited($event))->toBeTrue();
});

// ── API: POST /api/favourites/{event} ─────────────────────────────────────────

test('store adds event to favourites and returns 201', function () {
    $user  = User::factory()->create();
    $event = Event::factory()->create();

    $this->actingAs($user)
        ->postJson("/api/favourites/{$event->id}")
        ->assertStatus(201)
        ->assertJsonPath('favourited', true);

    expect($user->hasFavourited($event))->toBeTrue();
});

test('store is idempotent when event is already favourited', function () {
    $user  = User::factory()->create();
    $event = Event::factory()->create();

    $user->favouriteEvents()->attach($event->id);

    $this->actingAs($user)
        ->postJson("/api/favourites/{$event->id}")
        ->assertOk()
        ->assertJsonPath('favourited', true);
});

// ── API: DELETE /api/favourites/{event} ───────────────────────────────────────

test('destroy removes event from favourites', function () {
    $user  = User::factory()->create();
    $event = Event::factory()->create();

    $user->favouriteEvents()->attach($event->id);

    $this->actingAs($user)
        ->deleteJson("/api/favourites/{$event->id}")
        ->assertOk()
        ->assertJsonPath('favourited', false);

    expect($user->hasFavourited($event))->toBeFalse();
});

test('destroy only removes the event for the authenticated user', function () {
    $alice = User::factory()->create();
    $bob   = User::factory()->create();
    $event = Event::factory()->create();

    $alice->favouriteEvents()->attach($event->id);
    $bob->favouriteEvents()->attach($event->id);

    $this->actingAs($alice)
        ->deleteJson("/api/favourites/{$event->id}")
        ->assertOk();

    expect($alice->hasFavourited($event))->toBeFalse();
    expect($bob->hasFavourited($event))->toBeTrue();
});
