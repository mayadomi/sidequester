import { Head, router, usePage } from '@inertiajs/react';
import { Building2, Pencil, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { destroy, update } from '@/actions/App/Http/Controllers/SponsorPageController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

interface SponsorItem {
    id: number;
    name: string;
    slug: string;
    events_count: number;
    logo_square_url: string;
    logo_square_dark_url: string;
    logo_rect_url: string;
    logo_rect_dark_url: string;
}

interface SponsorsIndexProps {
    sponsors: SponsorItem[];
    isAdmin: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Event Hosts', href: '/event-hosts' },
];

export default function SponsorsIndex({ sponsors, isAdmin }: SponsorsIndexProps) {
    const { name } = usePage<SharedData>().props;

    const [search, setSearch] = useState('');
    const [renamingSponsor, setRenamingSponsor] = useState<SponsorItem | null>(null);
    const [editName, setEditName] = useState('');
    const [deletingSponsor, setDeletingSponsor] = useState<SponsorItem | null>(null);
    const [processing, setProcessing] = useState(false);

    const filtered = sponsors.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

    function openRename(sponsor: SponsorItem) {
        setRenamingSponsor(sponsor);
        setEditName(sponsor.name);
    }

    function submitRename() {
        if (!renamingSponsor || !editName.trim()) return;
        setProcessing(true);
        router.patch(
            update({ sponsor: renamingSponsor.slug }).url,
            { name: editName.trim() },
            {
                onFinish: () => {
                    setProcessing(false);
                    setRenamingSponsor(null);
                },
            },
        );
    }

    function submitDelete() {
        if (!deletingSponsor) return;
        setProcessing(true);
        router.delete(destroy({ sponsor: deletingSponsor.slug }).url, {
            onFinish: () => {
                setProcessing(false);
                setDeletingSponsor(null);
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Event Hosts | ${name}`} />

            <div className="mx-auto max-w-4xl p-4 lg:p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">{isAdmin ? 'Event Hosts' : 'My Event Hosts'}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {isAdmin
                            ? 'Manage logos for all event hosts shown across the planner.'
                            : 'Manage logos for your verified event hosts.'}
                    </p>
                </div>

                {sponsors.length > 0 && (
                    <div className="relative mb-4">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search event hosts…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                )}

                {sponsors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                        <Building2 className="mb-4 size-12 text-muted-foreground/30" />
                        <p className="text-muted-foreground">
                            {isAdmin
                                ? 'No event hosts found.'
                                : 'You have no verified event hosts yet. Visit My Event Hosts in your settings to submit a claim or request a new host.'}
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                        <Search className="mb-4 size-12 text-muted-foreground/30" />
                        <p className="text-muted-foreground">No event hosts match &ldquo;{search}&rdquo;.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((sponsor) => (
                            <Card key={sponsor.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <CardTitle className="text-base">{sponsor.name}</CardTitle>
                                        <div className="flex items-center gap-2">
                                            <span className="shrink-0 text-xs text-muted-foreground">
                                                {sponsor.events_count} event{sponsor.events_count !== 1 ? 's' : ''}
                                            </span>
                                            {isAdmin && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7"
                                                        onClick={() => openRename(sponsor)}
                                                        title="Rename"
                                                    >
                                                        <Pencil className="size-3.5" />
                                                    </Button>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-7 text-destructive hover:text-destructive"
                                                                    onClick={() => setDeletingSponsor(sponsor)}
                                                                    disabled={sponsor.events_count > 0}
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </Button>
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {sponsor.events_count > 0
                                                                ? 'Cannot delete: has events attached'
                                                                : 'Delete'}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Light mode logos */}
                                    <div>
                                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Light mode
                                        </p>
                                        <div className="grid gap-6 sm:grid-cols-2">
                                            <ImageUpload
                                                currentUrl={sponsor.logo_square_url || null}
                                                uploadRoute={`/event-hosts/${sponsor.slug}/images/logo_square`}
                                                deleteRoute={`/event-hosts/${sponsor.slug}/images/logo_square`}
                                                fieldName="image"
                                                label="Square logo"
                                                hint="Used in event cards. Recommended: 200×200px."
                                                aspectRatio="1/1"
                                            />
                                            <ImageUpload
                                                currentUrl={sponsor.logo_rect_url || null}
                                                uploadRoute={`/event-hosts/${sponsor.slug}/images/logo_rect`}
                                                deleteRoute={`/event-hosts/${sponsor.slug}/images/logo_rect`}
                                                fieldName="image"
                                                label="Rectangular logo"
                                                hint="Used in banners and headers. Recommended: 400×100px."
                                                aspectRatio="4/1"
                                            />
                                        </div>
                                    </div>

                                    {/* Dark mode logos */}
                                    <div>
                                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Dark mode
                                        </p>
                                        <div className="grid gap-6 sm:grid-cols-2">
                                            <ImageUpload
                                                currentUrl={sponsor.logo_square_dark_url || null}
                                                uploadRoute={`/event-hosts/${sponsor.slug}/images/logo_square_dark`}
                                                deleteRoute={`/event-hosts/${sponsor.slug}/images/logo_square_dark`}
                                                fieldName="image"
                                                label="Square logo"
                                                hint="Used in event cards. Recommended: 200×200px."
                                                aspectRatio="1/1"
                                            />
                                            <ImageUpload
                                                currentUrl={sponsor.logo_rect_dark_url || null}
                                                uploadRoute={`/event-hosts/${sponsor.slug}/images/logo_rect_dark`}
                                                deleteRoute={`/event-hosts/${sponsor.slug}/images/logo_rect_dark`}
                                                fieldName="image"
                                                label="Rectangular logo"
                                                hint="Used in banners and headers. Recommended: 400×100px."
                                                aspectRatio="4/1"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Rename dialog */}
            <Dialog open={!!renamingSponsor} onOpenChange={(open) => !open && setRenamingSponsor(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename event host</DialogTitle>
                        <DialogDescription>Enter a new name for &ldquo;{renamingSponsor?.name}&rdquo;.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="rename-input">Name</Label>
                        <Input
                            id="rename-input"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submitRename()}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenamingSponsor(null)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button onClick={submitRename} disabled={processing || !editName.trim()}>
                            {processing ? 'Saving…' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <Dialog open={!!deletingSponsor} onOpenChange={(open) => !open && setDeletingSponsor(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete event host</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &ldquo;{deletingSponsor?.name}&rdquo;? This will also remove all
                            associated logos. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingSponsor(null)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={submitDelete} disabled={processing}>
                            {processing ? 'Deleting…' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
