import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    Heart,
    Mail,
    Map,
    MapPin,
    Mountain,
    Route,
    Sparkles,
    Trophy,
    Users,
} from 'lucide-react';
import { useRef, useState } from 'react';

import AppLogo from '@/components/app-logo';
import { FavouriteButton } from '@/components/events/favourite-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { login, register, welcome } from '@/routes';
import type { SharedData } from '@/types';
import type { Event } from '@/types/events';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomeProps {
    upcomingEvents: Event[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatEventDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-AU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

function formatEventTime(iso: string): string {
    return iso.substring(11, 16);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home({ upcomingEvents }: HomeProps) {
    const { auth, name, festivalName, contactEmail } = usePage<SharedData>().props;
    const isLoggedIn = !!auth?.user;

    return (
        <>
            <Head title={`${name} — Tour Down Under Event Guide`} />
            <div className="flex min-h-screen flex-col bg-background text-foreground">
                <SiteNav isLoggedIn={isLoggedIn} />
                <main className="flex-1">
                    <HeroSection isLoggedIn={isLoggedIn} festivalName={festivalName} />
                    <UpcomingEventsSection events={upcomingEvents} isLoggedIn={isLoggedIn} />
                    <FeaturesSection name={name} festivalName={festivalName} />
                    {!isLoggedIn && <CreatorCtaSection name={name} festivalName={festivalName} contactEmail={contactEmail} />}
                </main>
                <SiteFooter name={name} contactEmail={contactEmail} />
            </div>
        </>
    );
}

// ─── Site nav ─────────────────────────────────────────────────────────────────

function SiteNav({ isLoggedIn }: { isLoggedIn: boolean }) {
    return (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
                <Link href="/" className="flex items-center gap-2">
                    <AppLogo />
                </Link>

                <nav className="flex items-center gap-2">
                    <Link
                        href="/events"
                        className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
                    >
                        Events
                    </Link>
                    <Link
                        href="/schedule"
                        className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
                    >
                        Schedule
                    </Link>
                    <Link
                        href="/map"
                        className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
                    >
                        Map
                    </Link>

                    <div className="ml-2 flex items-center gap-2">
                        {isLoggedIn ? (
                            <Button asChild size="sm">
                                <Link href={welcome().url}>
                                    Go to app
                                    <ArrowRight className="ml-1.5 size-3.5" />
                                </Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild variant="ghost" size="sm">
                                    <Link href={login().url}>Sign in</Link>
                                </Button>
                                <Button asChild size="sm">
                                    <Link href={register().url}>Sign up free</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
}

// ─── Hero section ─────────────────────────────────────────────────────────────

function HeroSection({ isLoggedIn, festivalName }: { isLoggedIn: boolean; festivalName: string }) {
    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-[#071e3d] via-[#0d2a50] to-[#0a1a38] py-20 text-white sm:py-28">
            {/* Glow orbs */}
            <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#0a72bf]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-[#0ab0a6]/10 blur-3xl" />

            <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
                <div className="mb-8 flex justify-center">
                    <img src="/logo.svg" alt={`${festivalName} SideQuester`} className="h-32 translate-x-2 sm:h-40 lg:h-48" />
                </div>

                <a
                    href="https://tourdownunder.com.au/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-white/30"
                >
                    <Sparkles className="size-3.5" />
                    Santos Tour Down Under
                </a>

                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                    Your sidekick for all your
                    <br />
                    <span className="text-[#ff7405]">{festivalName} sidequests</span>
                </h1>

                <p className="mx-auto mt-6 max-w-2xl text-lg text-white/85 sm:text-xl">
                    Every race stage, group ride, watch party, and expo — mapped, scheduled, and ready.
                    Tame the chaos and craft your perfect {festivalName} quest.
                </p>

                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    {isLoggedIn ? (
                        <>
                            <Button
                                asChild
                                size="lg"
                                className="bg-white font-semibold text-[#0a72bf] hover:bg-blue-50"
                            >
                                <Link href="/events">
                                    Browse all events
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                            >
                                <Link href="/favourites">
                                    <Heart className="mr-2 size-4" />
                                    My Favourites
                                </Link>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                asChild
                                size="lg"
                                className="bg-white font-semibold text-[#0a72bf] hover:bg-blue-50"
                            >
                                <Link href={register().url}>
                                    Plan My {festivalName}
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                            >
                                <Link href={`${register().url}?intent=creator`}>
                                    List my event
                                </Link>
                            </Button>
                        </>
                    )}
                </div>

                {/* Quick stats */}
                <div className="mt-14 flex flex-wrap justify-center gap-8 text-sm text-white/80">
                    <div className="flex items-center gap-2">
                        <Calendar className="size-4" />
                        <span>Race stages &amp; official events</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Route className="size-4" />
                        <span>Group rides &amp; local racing</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Map className="size-4" />
                        <span>Interactive map &amp; schedule</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── Upcoming events section ───────────────────────────────────────────────────

function UpcomingEventsSection({ events, isLoggedIn }: { events: Event[]; isLoggedIn: boolean }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const updateScrollState = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 8);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    };

    const scroll = (dir: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === 'left' ? -360 : 360, behavior: 'smooth' });
    };

    if (events.length === 0) return null;

    return (
        <section className="py-14 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="mb-8 flex items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-[#ff7405]">
                            Quests ahead
                        </p>
                        <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Upcoming adventures</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => scroll('left')}
                            disabled={!canScrollLeft}
                            className="flex size-9 items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            disabled={!canScrollRight}
                            className="flex size-9 items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Scroll right"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    onScroll={updateScrollState}
                    className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6"
                    style={{ scrollSnapType: 'x mandatory' }}
                >
                    {events.map((event) => (
                        <EventCarouselCard
                            key={event.id}
                            event={event}
                            isLoggedIn={isLoggedIn}
                        />
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <Button asChild variant="outline" size="lg">
                        <Link href="/events">
                            View all events
                            <ArrowRight className="ml-2 size-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}

// ─── Event carousel card ──────────────────────────────────────────────────────

function EventCarouselCard({ event, isLoggedIn }: { event: Event; isLoggedIn: boolean }) {
    const { resolvedAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    const sponsorLogo = isDark
        ? (event.sponsor?.logo_square_dark_url || event.sponsor?.logo_square_url)
        : event.sponsor?.logo_square_url;

    return (
        <div
            className="hover-jiggle w-72 shrink-0 overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
            style={{ scrollSnapAlign: 'start' }}
        >
            {/* Banner */}
            <div className="relative h-36 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                {event.banner_image_url ? (
                    <img
                        src={event.banner_image_url}
                        alt={event.title}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Calendar className="size-10 text-slate-300 dark:text-slate-600" />
                    </div>
                )}

                {/* Badges */}
                <div className="absolute left-2 top-2 flex gap-1">
                    {event.is_happening_now && (
                        <Badge className="animate-pulse bg-green-500 text-white text-[10px]">
                            <span className="mr-1 size-1.5 rounded-full bg-white" />
                            Live
                        </Badge>
                    )}
                    {event.is_featured && (
                        <Badge className="bg-[#d4920a] text-white text-[10px]">
                            <Sparkles className="mr-1 size-2.5" />
                            Featured
                        </Badge>
                    )}
                </div>

                {/* Sponsor logo */}
                {sponsorLogo && (
                    <div className="absolute bottom-2 right-2 rounded-md bg-white/95 p-1.5 shadow dark:bg-gray-900/95">
                        <img src={sponsorLogo} alt={event.sponsor?.name} className="size-8 object-contain" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <Link
                    href={`/events/${event.id}`}
                    className="line-clamp-2 text-sm font-semibold leading-snug hover:text-primary"
                >
                    {event.title}
                </Link>

                {event.category && (
                    <Badge className="mt-2 bg-blue-100 text-blue-800 text-[10px] dark:bg-blue-900/30 dark:text-blue-300">
                        {event.category.name}
                    </Badge>
                )}

                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 shrink-0" />
                        <span>{formatEventDate(event.start_datetime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5 shrink-0" />
                        <span>{formatEventTime(event.start_datetime)} – {formatEventTime(event.end_datetime)}</span>
                    </div>
                    {event.location_name && (
                        <div className="flex items-center gap-1.5">
                            <MapPin className="size-3.5 shrink-0" />
                            <span className="truncate">{event.location_name}</span>
                        </div>
                    )}
                    {event.is_ride && event.ride_distance_km && (
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <Route className="size-3.5" />
                                {event.ride_distance_km} km
                            </span>
                            {event.elevation_gain_m && (
                                <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                    <Mountain className="size-3.5" />
                                    {event.elevation_gain_m} m
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t px-4 py-2.5">
                <span className={cn('text-xs font-medium', event.is_free ? 'text-green-600 dark:text-green-400' : 'text-foreground')}>
                    {event.is_free ? 'Free' : event.cost_formatted}
                </span>
                {isLoggedIn ? (
                    <FavouriteButton eventId={event.id} isFavourited={event.is_favourited} />
                ) : (
                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                        <Link href={`/events/${event.id}`}>View details</Link>
                    </Button>
                )}
            </div>
        </div>
    );
}

// ─── Features section ─────────────────────────────────────────────────────────

function FeaturesSection({ name, festivalName }: { name: string; festivalName: string }) {
    const features = [
        {
            icon: Calendar,
            title: 'All the sidequests',
            description:
                `Race stages, watch parties, group rides, expos, food & wine events — every ${festivalName} event, curated and ready to explore.`,
        },
        {
            icon: Map,
            title: 'Map your sidequest',
            description:
                "Every event plotted on an interactive map with route overlays. Explore the map and find events near you or along the race.",
        },
        {
            icon: Heart,
            title: 'Build your sidequest itinerary',
            description:
                "Favourite the events you refuse to miss. Your personal sidequest plan is always one tap away.",
        },
        {
            icon: Trophy,
            title: 'Day-by-day sidequest view',
            description:
                `Navigate the packed ${festivalName} calendar with a day-by-day timeline — your compass to navigate the chaos ahead.`,
        },
        {
            icon: Users,
            title: 'Community & groups',
            description:
                'Events from official sponsors, local clubs, brand collabs and community organisers — a full compendium of the cycling world.',
        },
        {
            icon: Route,
            title: 'Know the terrain',
            description:
                "Distance, elevation, pace and route maps for every group ride — get the best out of every ride.",
        },
    ];

    return (
        <section className="bg-muted/40 py-14 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="mb-12 text-center">
                    <p className="text-sm font-semibold uppercase tracking-wide text-[#ff7405]">Your quest toolkit</p>
                    <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Everything a sidekick needs for {festivalName}</h2>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map(({ icon: Icon, title, description }) => (
                        <div key={title} className="hover-jiggle rounded-xl border bg-background p-6 shadow-sm">
                            <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <Icon className="size-5 text-[#0a72bf]" />
                            </div>
                            <h3 className="font-semibold">{title}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Creator CTA section ──────────────────────────────────────────────────────

function CreatorCtaSection({ name, festivalName, contactEmail }: { name: string; festivalName: string; contactEmail: string }) {
    return (
        <section className="py-14 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#071e3d] via-[#0d2a50] to-[#0a1a38] p-8 text-white shadow-xl sm:p-12">
                    <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                        <div>
                            <Badge className="mb-4 bg-white/20 text-white hover:bg-white/25">
                                For event organisers &amp; sponsors
                            </Badge>
                            <h2 className="text-2xl font-bold sm:text-3xl">
                                Add your {festivalName} event to the quest
                            </h2>
                            <p className="mt-4 text-white/85">
                                Organising a group ride, watch party, expo stand, or community event during
                                {' '}{festivalName}? Get your sidequest in front of thousands of cycling fans and
                                participants — and make it part of the adventure.
                            </p>
                            <ul className="mt-6 space-y-2 text-sm text-white/80">
                                <li className="flex items-center gap-2">
                                    <span className="size-1.5 rounded-full bg-[#ff7405]" />
                                    Free to list community events
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="size-1.5 rounded-full bg-[#ff7405]" />
                                    Appear in the schedule, map, and event search
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="size-1.5 rounded-full bg-[#ff7405]" />
                                    Sponsor branding and logo placement available
                                </li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-4 lg:items-end">
                            <Button
                                asChild
                                size="lg"
                                className="w-full bg-white font-semibold text-orange-600 hover:bg-orange-50 lg:w-auto"
                            >
                                <Link href={`${register().url}?intent=creator`}>
                                    Sign up as event organiser
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                            <p className="text-center text-sm text-white/70 lg:text-right">
                                Editor access is requested automatically at sign-up.
                            </p>
                            <Button
                                asChild
                                size="sm"
                                variant="ghost"
                                className="text-white/80 hover:bg-white/10 hover:text-white"
                            >
                                <a href={`mailto:${contactEmail}`}>
                                    <Mail className="mr-1.5 size-4" />
                                    Contact us directly
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── Site footer ──────────────────────────────────────────────────────────────

function SiteFooter({ name, contactEmail }: { name: string; contactEmail: string }) {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gradient-to-br from-[#071e3d] via-[#0d2a50] to-[#0a1a38] text-white">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2">
                            <AppLogo />
                        </div>
                        <p className="mt-3 text-sm text-white/60">
                            Your unofficial sidekick for the{' '}
                            <a
                                href="https://tourdownunder.com.au/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline underline-offset-2 hover:text-white"
                            >
                                Santos Tour Down Under
                            </a>{' '}
                            — the Southern Hemisphere's biggest cycling event.
                        </p>
                    </div>

                    {/* Explore */}
                    <div>
                        <h4 className="mb-4 text-sm font-semibold text-white">Explore</h4>
                        <ul className="space-y-2 text-sm text-white/60">
                            <li><Link href="/events" className="hover:text-white">All events</Link></li>
                            <li><Link href="/schedule" className="hover:text-white">Schedule</Link></li>
                            <li><Link href="/map" className="hover:text-white">Map</Link></li>
                            <li><Link href="/favourites" className="hover:text-white">My Favourites</Link></li>
                        </ul>
                    </div>

                    {/* Account */}
                    <div>
                        <h4 className="mb-4 text-sm font-semibold text-white">Account</h4>
                        <ul className="space-y-2 text-sm text-white/60">
                            <li><Link href={login().url} className="hover:text-white">Sign in</Link></li>
                            <li><Link href={register().url} className="hover:text-white">Create account</Link></li>
                            <li><Link href={`${register().url}?intent=creator`} className="hover:text-white">List your event</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="mb-4 text-sm font-semibold text-white">Contact</h4>
                        <ul className="space-y-2 text-sm text-white/60">
                            <li>
                                <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 hover:text-white">
                                    <Mail className="size-3.5" />
                                    {contactEmail}
                                </a>
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                                <span>Adelaide, South Australia</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">
                    <p>
                        &copy; {currentYear} TDU Side Quester. Not affiliated with Santos Tour Down Under or Events South Australia.
                    </p>
                </div>
            </div>
        </footer>
    );
}
