import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    Filter,
    Heart,
    Map,
    MapPin,
    Pencil,
    X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import type { BreadcrumbItem, SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Welcome', href: '/welcome' }];

export default function Welcome() {
    const { auth, name: appName, festivalName } = usePage<SharedData>().props;
    const role = auth?.user?.role;
    const name = auth?.user?.name?.split(' ')[0] ?? 'there';
    const isCreator = role === 'editor_pending' || role === 'editor';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Welcome | ${appName}`} />
            {isCreator ? (
                <CreatorWelcome name={name} role={role as string} festivalName={festivalName} />
            ) : (
                <ViewerWelcome name={name} festivalName={festivalName} />
            )}
        </AppLayout>
    );
}

// ─── Viewer welcome ───────────────────────────────────────────────────────────

function ViewerWelcome({ name, festivalName }: { name: string; festivalName: string }) {
    const features = [
        {
            icon: Calendar,
            title: 'Browse all events',
            description: 'Explore race stages, group rides, watch parties, expos and more.',
            href: '/events',
            color: 'bg-[#0a72bf]/10 text-[#0a72bf] dark:bg-[#0a72bf]/15 dark:text-[#5aadff]',
            hoverRing: 'hover:ring-[#0a72bf]/25',
        },
        {
            icon: Heart,
            title: 'Save your favourites',
            description: `Tap the heart on any event to build your personal ${festivalName} itinerary.`,
            href: '/favourites',
            color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
            hoverRing: 'hover:ring-rose-400/25',
        },
        {
            icon: Clock,
            title: 'Day-by-day schedule',
            description: 'See every event laid out by day — perfect for planning your week.',
            href: '/schedule',
            color: 'bg-[#0ab0a6]/10 text-[#0ab0a6] dark:bg-[#0ab0a6]/15 dark:text-[#0ab0a6]',
            hoverRing: 'hover:ring-[#0ab0a6]/25',
        },
        {
            icon: Map,
            title: 'Interactive map',
            description: 'Find events near you with an interactive map and route overlays.',
            href: '/map',
            color: 'bg-[#ff7405]/10 text-[#ff7405] dark:bg-[#ff7405]/15 dark:text-[#ff7405]',
            hoverRing: 'hover:ring-[#ff7405]/25',
        },
    ];

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {/* Dark gradient header */}
            <div className="shrink-0 border-b bg-gradient-to-br from-[#071e3d] via-[#0d2a50] to-[#0a1a38] px-4 py-8 text-white sm:px-6 sm:py-10">
                <div className="mx-auto max-w-3xl">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <img
                            src="/sidequester_bicycle.svg"
                            alt=""
                            aria-hidden="true"
                            className="h-14 w-auto shrink-0 translate-x-2 sm:h-16"
                        />
                        <div>
                            <h1 className="text-2xl font-bold sm:text-3xl">Welcome, {name}!</h1>
                            <p className="mt-1 text-sm text-white/70 sm:text-base">
                                Your account is ready — explore {festivalName} like never before.
                            </p>
                        </div>
                    </div>

                    {/* Guide hints */}
                    <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-white/55">
                        <span className="flex items-center gap-1.5">
                            <Filter className="size-3 shrink-0" />
                            Filter events by category, date, or distance
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Heart className="size-3 shrink-0" />
                            Save events to build your personal itinerary
                        </span>
                        <span className="flex items-center gap-1.5">
                            <MapPin className="size-3 shrink-0" />
                            Explore routes and locations on the map
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-3xl p-4 py-8 sm:p-8">
                    <p className="mb-5 text-sm font-medium text-muted-foreground">Here's what you can do:</p>

                    {/* Feature cards */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        {features.map(({ icon: Icon, title, description, href, color, hoverRing }) => (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    'group flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:ring-1',
                                    hoverRing,
                                )}
                            >
                                <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', color)}>
                                    <Icon className="size-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold group-hover:text-primary">{title}</p>
                                    <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                                </div>
                                <ArrowRight className="ml-auto mt-0.5 size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                            </Link>
                        ))}
                    </div>

                    {/* CTAs */}
                    <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <Button asChild size="lg">
                            <Link href="/events">
                                Browse all events
                                <ArrowRight className="ml-2 size-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <Link href={home().url}>Go to homepage</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Creator welcome ──────────────────────────────────────────────────────────

function CreatorWelcome({ name, role, festivalName }: { name: string; role: string; festivalName: string }) {
    const isPending = role === 'editor_pending';

    const steps = [
        { label: 'Create your account', done: true },
        { label: 'Submit editor access request', done: true },
        { label: 'Admin review & approval', done: !isPending, active: isPending },
        { label: 'Start creating events', done: !isPending, active: false },
    ];

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {/* Dark gradient header */}
            <div className="shrink-0 border-b bg-gradient-to-br from-[#071e3d] via-[#0d2a50] to-[#0a1a38] px-4 py-8 text-white sm:px-6 sm:py-10">
                <div className="mx-auto max-w-3xl">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <img
                            src="/sidequester_bicycle.svg"
                            alt=""
                            aria-hidden="true"
                            className="h-14 w-auto shrink-0 translate-x-2 sm:h-16"
                        />
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-[#ff7405]">
                                Event Creator
                            </p>
                            <h1 className="text-2xl font-bold sm:text-3xl">
                                {isPending ? `Almost there, ${name}!` : `Welcome, ${name}!`}
                            </h1>
                            <p className="mt-1 text-sm text-white/70 sm:text-base">
                                {isPending
                                    ? 'Your editor access request is awaiting admin approval.'
                                    : `Your editor access is approved — start listing ${festivalName} events.`}
                            </p>
                        </div>
                    </div>

                    {/* Status pill */}
                    <div className="mt-5 flex justify-center">
                        <span
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1',
                                isPending
                                    ? 'bg-[#d4920a]/20 text-[#f0b030] ring-[#d4920a]/40'
                                    : 'bg-[#0ab0a6]/20 text-[#0ab0a6] ring-[#0ab0a6]/40',
                            )}
                        >
                            <span className={cn('size-1.5 rounded-full', isPending ? 'bg-[#f0b030] animate-pulse' : 'bg-[#0ab0a6]')} />
                            {isPending ? 'Approval pending' : 'Editor access active'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-3xl p-4 py-8 sm:p-8 space-y-6">
                    {/* Progress steps */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Your progress
                        </h2>
                        <ol className="space-y-4">
                            {steps.map(({ label, done, active }, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    {done ? (
                                        <CheckCircle2 className="size-5 shrink-0 text-green-500" />
                                    ) : active ? (
                                        <Circle className="size-5 shrink-0 animate-pulse text-[#d4920a]" />
                                    ) : (
                                        <Circle className="size-5 shrink-0 text-muted-foreground/30" />
                                    )}
                                    <span
                                        className={cn(
                                            'text-sm',
                                            done && 'font-medium text-foreground',
                                            active && 'font-medium text-[#b87c08] dark:text-[#f0b030]',
                                            !done && !active && 'text-muted-foreground',
                                        )}
                                    >
                                        {label}
                                        {active && ' — pending'}
                                    </span>
                                </li>
                            ))}
                        </ol>

                        {isPending && (
                            <div className="mt-5 rounded-lg border border-[#d4920a]/30 bg-[#d4920a]/8 px-4 py-3 dark:border-[#d4920a]/40 dark:bg-[#d4920a]/10">
                                <p className="text-sm text-[#b87c08] dark:text-[#f0b030]">
                                    You'll receive an email when your request is approved. This usually happens within 24 hours.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* In the meantime / next steps */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 font-semibold">
                            {isPending ? 'In the meantime, explore the app' : 'Get started'}
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {isPending ? (
                                <>
                                    {[
                                        { label: 'Browse events', href: '/events' },
                                        { label: 'Check the schedule', href: '/schedule' },
                                        { label: 'View the map', href: '/map' },
                                        { label: 'Go to homepage', href: home().url },
                                    ].map(({ label, href }) => (
                                        <Button key={href} asChild variant="outline" size="sm">
                                            <Link href={href}>{label}</Link>
                                        </Button>
                                    ))}
                                </>
                            ) : (
                                <>
                                    <Button asChild size="sm">
                                        <Link href="/events/create">
                                            <Pencil className="mr-1.5 size-3.5" />
                                            Create your first event
                                        </Link>
                                    </Button>
                                    {[
                                        { label: 'Browse events', href: '/events' },
                                        { label: 'View the map', href: '/map' },
                                    ].map(({ label, href }) => (
                                        <Button key={href} asChild variant="outline" size="sm">
                                            <Link href={href}>{label}</Link>
                                        </Button>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Cancel request */}
                    {isPending && (
                        <div className="text-center">
                            <button
                                onClick={() => router.delete('/profile/request-editor')}
                                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive"
                            >
                                <X className="size-3.5" />
                                Cancel editor access request
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
