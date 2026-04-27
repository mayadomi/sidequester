<?php

use App\Models\Category;
use App\Models\Event;
use App\Models\Sponsor;
use App\Models\SponsorClaim;
use App\Models\User;

// ── Helpers ───────────────────────────────────────────────────────────────────

function tduSponsor(): Sponsor
{
    return Sponsor::firstOrCreate(
        ['slug' => config('tdu.host_sponsor_slug')],
        ['name' => 'Tour Down Under'],
    );
}

function tduEditor(): User
{
    $user = User::factory()->create(['role' => 'editor']);
    SponsorClaim::factory()->verified()->create([
        'user_id' => $user->id,
        'sponsor_id' => tduSponsor()->id,
    ]);

    return $user;
}

// ── Create form — visible categories ─────────────────────────────────────────

test('regular editor does not see restricted categories on the create form', function () {
    Category::factory()->create(['slug' => 'race-stages', 'name' => 'Race Stages']);
    Category::factory()->create(['slug' => 'group-rides', 'name' => 'Group Rides']);
    $editor = User::factory()->create(['role' => 'editor']);

    $this->actingAs($editor)
        ->get(route('events.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('events/create')
            ->where('categories', fn ($cats) =>
                collect($cats)->pluck('slug')->doesntContain('race-stages') &&
                collect($cats)->pluck('slug')->contains('group-rides')
            )
        );
});

test('TDU editor sees all categories on the create form', function () {
    Category::factory()->create(['slug' => 'race-stages', 'name' => 'Race Stages']);
    Category::factory()->create(['slug' => 'group-rides', 'name' => 'Group Rides']);

    $this->actingAs(tduEditor())
        ->get(route('events.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('events/create')
            ->where('categories', fn ($cats) =>
                collect($cats)->pluck('slug')->contains('race-stages') &&
                collect($cats)->pluck('slug')->contains('group-rides')
            )
        );
});

test('admin sees all categories on the create form', function () {
    Category::factory()->create(['slug' => 'race-stages', 'name' => 'Race Stages']);
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get(route('events.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('events/create')
            ->where('categories', fn ($cats) =>
                collect($cats)->pluck('slug')->contains('race-stages')
            )
        );
});

// ── Edit form — visible categories ────────────────────────────────────────────

test('regular editor does not see restricted categories on the edit form', function () {
    $open = Category::factory()->create(['slug' => 'group-rides', 'name' => 'Group Rides']);
    Category::factory()->create(['slug' => 'official-events', 'name' => 'Official Events']);

    $editor = User::factory()->create(['role' => 'editor']);
    $event = Event::factory()->create([
        'category_id' => $open->id,
        'created_by_user_id' => $editor->id,
    ]);

    $this->actingAs($editor)
        ->get(route('events.edit', $event))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('events/edit')
            ->where('categories', fn ($cats) =>
                collect($cats)->pluck('slug')->doesntContain('official-events') &&
                collect($cats)->pluck('slug')->contains('group-rides')
            )
        );
});

// ── Store — backend validation ────────────────────────────────────────────────

test('regular editor cannot store an event with a restricted category', function () {
    $restricted = Category::factory()->create(['slug' => 'race-stages', 'name' => 'Race Stages']);
    $sponsor = Sponsor::factory()->create();
    $editor = User::factory()->create(['role' => 'editor']);

    SponsorClaim::factory()->verified()->create([
        'user_id' => $editor->id,
        'sponsor_id' => $sponsor->id,
    ]);

    $this->actingAs($editor)
        ->post(route('events.store'), [
            'title' => 'Test Event',
            'start_datetime' => '2026-05-01 09:00:00',
            'end_datetime' => '2026-05-01 12:00:00',
            'category_id' => $restricted->id,
            'sponsor_id' => $sponsor->id,
        ])
        ->assertSessionHasErrors('category_id');
});

test('TDU editor can store an event with a restricted category', function () {
    $restricted = Category::factory()->create(['slug' => 'race-stages', 'name' => 'Race Stages']);
    $tdu = tduSponsor();
    $editor = tduEditor();

    $this->actingAs($editor)
        ->post(route('events.store'), [
            'title' => 'TDU Race Stage',
            'start_datetime' => '2026-05-01 09:00:00',
            'end_datetime' => '2026-05-01 12:00:00',
            'category_id' => $restricted->id,
            'sponsor_id' => $tdu->id,
        ])
        ->assertSessionHasNoErrors();
});

test('admin can store an event with a restricted category', function () {
    $restricted = Category::factory()->create(['slug' => 'official-events', 'name' => 'Official Events']);
    $sponsor = Sponsor::factory()->create();
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->post(route('events.store'), [
            'title' => 'Official Event',
            'start_datetime' => '2026-05-01 09:00:00',
            'end_datetime' => '2026-05-01 12:00:00',
            'category_id' => $restricted->id,
            'sponsor_id' => $sponsor->id,
        ])
        ->assertSessionHasNoErrors();
});

// ── Update — backend validation ───────────────────────────────────────────────

test('regular editor cannot update an event to a restricted category', function () {
    $open = Category::factory()->create(['slug' => 'group-rides', 'name' => 'Group Rides']);
    $restricted = Category::factory()->create(['slug' => 'race-stages', 'name' => 'Race Stages']);
    $sponsor = Sponsor::factory()->create();
    $editor = User::factory()->create(['role' => 'editor']);

    SponsorClaim::factory()->verified()->create([
        'user_id' => $editor->id,
        'sponsor_id' => $sponsor->id,
    ]);

    $event = Event::factory()->create([
        'category_id' => $open->id,
        'sponsor_id' => $sponsor->id,
        'created_by_user_id' => $editor->id,
    ]);

    $this->actingAs($editor)
        ->patch(route('events.update', $event), [
            'title' => $event->title,
            'start_datetime' => $event->start_datetime->format('Y-m-d H:i:s'),
            'end_datetime' => $event->end_datetime->format('Y-m-d H:i:s'),
            'category_id' => $restricted->id,
            'sponsor_id' => $sponsor->id,
        ])
        ->assertSessionHasErrors('category_id');
});

test('TDU editor can update an event to a restricted category', function () {
    $open = Category::factory()->create(['slug' => 'group-rides', 'name' => 'Group Rides']);
    $restricted = Category::factory()->create(['slug' => 'race-stages', 'name' => 'Race Stages']);
    $tdu = tduSponsor();
    $editor = tduEditor();

    $event = Event::factory()->create([
        'category_id' => $open->id,
        'sponsor_id' => $tdu->id,
        'created_by_user_id' => $editor->id,
    ]);

    $this->actingAs($editor)
        ->patch(route('events.update', $event), [
            'title' => $event->title,
            'start_datetime' => $event->start_datetime->format('Y-m-d H:i:s'),
            'end_datetime' => $event->end_datetime->format('Y-m-d H:i:s'),
            'category_id' => $restricted->id,
            'sponsor_id' => $tdu->id,
        ])
        ->assertSessionHasNoErrors();
});
