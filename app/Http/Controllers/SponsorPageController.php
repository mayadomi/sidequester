<?php

namespace App\Http\Controllers;

use App\Models\Sponsor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SponsorPageController extends Controller
{
    /**
     * List sponsors for the management view.
     * Admins see all sponsors; editors see only their verified sponsors.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = Sponsor::withCount('events')->orderBy('name');

        if (! $user->isAdmin()) {
            $verifiedSponsorIds = $user->verifiedSponsors()->pluck('sponsors.id');
            $query->whereIn('id', $verifiedSponsorIds);
        }

        $sponsors = $query->get()->map(fn ($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'slug' => $s->slug,
            'events_count' => $s->events_count,
            'logo_square_url' => $s->getFirstMediaUrl('logo_square', 'display'),
            'logo_square_dark_url' => $s->getFirstMediaUrl('logo_square_dark', 'display'),
            'logo_rect_url' => $s->getFirstMediaUrl('logo_rect', 'display'),
            'logo_rect_dark_url' => $s->getFirstMediaUrl('logo_rect_dark', 'display'),
        ]);

        return Inertia::render('event-hosts/index', [
            'sponsors' => $sponsors,
            'isAdmin' => $user->isAdmin(),
        ]);
    }

    /**
     * Rename a sponsor. Admin only.
     */
    public function update(Request $request, Sponsor $sponsor): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $sponsor->update([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
        ]);

        return redirect()->route('event-hosts.index')->with('success', 'Event host renamed.');
    }

    /**
     * Delete a sponsor and all associated media. Admin only.
     * Sponsors with events attached cannot be deleted.
     */
    public function destroy(Request $request, Sponsor $sponsor): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        if ($sponsor->events()->exists()) {
            return back()->withErrors(['delete' => 'Cannot delete an event host that has events attached.']);
        }

        $sponsor->delete();

        return redirect()->route('event-hosts.index')->with('success', 'Event host deleted.');
    }

    /**
     * Upload a sponsor image to the given collection.
     * Editors may only upload to their verified sponsors.
     */
    public function uploadImage(Request $request, Sponsor $sponsor, string $collection): RedirectResponse
    {
        abort_unless(in_array($collection, ['logo_square', 'logo_square_dark', 'logo_rect', 'logo_rect_dark'], true), 404);

        $this->authoriseSponsorAccess($request, $sponsor);

        $request->validate([
            'image' => ['required', 'image', 'max:2048', 'mimes:jpg,jpeg,png,webp,svg'],
        ]);

        $sponsor->addMediaFromRequest('image')
            ->toMediaCollection($collection);

        return back()->with('success', 'Image updated.');
    }

    /**
     * Delete a sponsor image from the given collection.
     * Editors may only delete from their verified sponsors.
     */
    public function deleteImage(Request $request, Sponsor $sponsor, string $collection): RedirectResponse
    {
        abort_unless(in_array($collection, ['logo_square', 'logo_square_dark', 'logo_rect', 'logo_rect_dark'], true), 404);

        $this->authoriseSponsorAccess($request, $sponsor);

        $sponsor->clearMediaCollection($collection);

        return back()->with('success', 'Image removed.');
    }

    /**
     * Abort with 403 if the current user is not an admin and is not verified for the given sponsor.
     */
    private function authoriseSponsorAccess(Request $request, Sponsor $sponsor): void
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return;
        }

        $isVerified = $user->verifiedSponsors()
            ->where('sponsors.id', $sponsor->id)
            ->exists();

        abort_unless($isVerified, 403);
    }
}
