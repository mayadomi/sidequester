<?php

use App\Models\User;

// ── Page access ───────────────────────────────────────────────────────────────

test('guests are redirected to login', function () {
    $this->get(route('admin.users.index'))->assertRedirect(route('login'));
});

test('viewers cannot access the user management page', function () {
    $this->actingAs(User::factory()->create(['role' => 'viewer']))
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

test('editor_pending users cannot access the user management page', function () {
    $this->actingAs(User::factory()->create(['role' => 'editor_pending']))
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

test('editors cannot access the user management page', function () {
    $this->actingAs(User::factory()->create(['role' => 'editor']))
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

test('admins can access the user management page', function () {
    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/users/index'));
});

// ── Page data ─────────────────────────────────────────────────────────────────

test('page passes users, pendingCount and search props', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    User::factory()->create(['role' => 'editor_pending']);

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->has('users')
            ->has('pendingCount')
            ->has('search')
            ->where('pendingCount', 1)
        );
});

test('each user row includes created_at and last_login_at', function () {
    $admin = User::factory()->create(['role' => 'admin', 'last_login_at' => now()]);

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->has('users.0', fn ($user) => $user
                ->has('created_at')
                ->has('last_login_at')
                ->etc()
            )
        );
});

// ── Search ────────────────────────────────────────────────────────────────────

test('search filters users by name', function () {
    $admin = User::factory()->create(['role' => 'admin', 'name' => 'Alice Admin']);
    User::factory()->create(['role' => 'viewer', 'name' => 'Bob Viewer']);

    $this->actingAs($admin)
        ->get(route('admin.users.index', ['search' => 'Alice']))
        ->assertInertia(fn ($page) => $page
            ->has('users', 1)
            ->where('users.0.name', 'Alice Admin')
        );
});

test('search filters users by email', function () {
    $admin = User::factory()->create(['role' => 'admin', 'email' => 'admin@example.com']);
    User::factory()->create(['role' => 'viewer', 'email' => 'viewer@other.com']);

    $this->actingAs($admin)
        ->get(route('admin.users.index', ['search' => 'example.com']))
        ->assertInertia(fn ($page) => $page->has('users', 1));
});

test('search returns empty results when no users match', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get(route('admin.users.index', ['search' => 'zzznomatch']))
        ->assertInertia(fn ($page) => $page->has('users', 0));
});

// ── Role update access ────────────────────────────────────────────────────────

test('guests cannot update a user role', function () {
    $user = User::factory()->create(['role' => 'viewer']);

    $this->patch(route('admin.users.update-role', $user), ['role' => 'editor'])
        ->assertRedirect(route('login'));
});

test('viewers cannot update a user role', function () {
    $viewer = User::factory()->create(['role' => 'viewer']);
    $target = User::factory()->create(['role' => 'viewer']);

    $this->actingAs($viewer)
        ->patch(route('admin.users.update-role', $target), ['role' => 'editor'])
        ->assertForbidden();
});

test('editors cannot update a user role', function () {
    $editor = User::factory()->create(['role' => 'editor']);
    $target = User::factory()->create(['role' => 'viewer']);

    $this->actingAs($editor)
        ->patch(route('admin.users.update-role', $target), ['role' => 'editor'])
        ->assertForbidden();
});

// ── Role update behaviour ─────────────────────────────────────────────────────

test('admins can update another user role', function () {
    $admin  = User::factory()->create(['role' => 'admin']);
    $target = User::factory()->create(['role' => 'viewer']);

    $this->actingAs($admin)
        ->patch(route('admin.users.update-role', $target), ['role' => 'editor'])
        ->assertRedirect();

    expect($target->fresh()->role)->toBe('editor');
});

test('admins can approve a pending editor request', function () {
    $admin   = User::factory()->create(['role' => 'admin']);
    $pending = User::factory()->create(['role' => 'editor_pending']);

    $this->actingAs($admin)
        ->patch(route('admin.users.update-role', $pending), ['role' => 'editor'])
        ->assertRedirect();

    expect($pending->fresh()->role)->toBe('editor');
});

test('admins cannot remove their own admin role', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->patch(route('admin.users.update-role', $admin), ['role' => 'viewer'])
        ->assertSessionHasErrors('role');

    expect($admin->fresh()->role)->toBe('admin');
});

test('role update rejects invalid role values', function () {
    $admin  = User::factory()->create(['role' => 'admin']);
    $target = User::factory()->create(['role' => 'viewer']);

    $this->actingAs($admin)
        ->patch(route('admin.users.update-role', $target), ['role' => 'superuser'])
        ->assertSessionHasErrors('role');
});
