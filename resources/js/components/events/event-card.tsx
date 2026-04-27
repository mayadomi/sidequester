import { Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    Clock,
    ExternalLink,
    Gauge,
    MapPin,
    Mountain,
    Pencil,
    Repeat,
    Route,
    Sparkles,
    Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';
import type { Event } from '@/types/events';

import { FavouriteButton } from './favourite-button';

// Replace with any stable cycling image URL if needed
const FALLBACK_CYCLING_IMAGE = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&h=400&q=80';

const CATEGORY_BADGE_COLORS: Record<string, string> = {
    'race-stages':     'bg-[#0a72bf]/10 text-[#0a72bf] dark:bg-[#0a72bf]/20 dark:text-[#4da6f5]',
    'official-events': 'bg-[#0a3d7a]/10 text-[#0a3d7a] dark:bg-[#0a3d7a]/20 dark:text-[#6090d0]',
    'watch-parties':   'bg-[#2e8fd4]/10 text-[#2e8fd4] dark:bg-[#2e8fd4]/20 dark:text-[#2e8fd4]',
    'group-rides':     'bg-[#ff7405]/10 text-[#ff7405] dark:bg-[#ff7405]/20 dark:text-[#ff9040]',
    'local-racing':    'bg-[#c84a00]/10 text-[#c84a00] dark:bg-[#c84a00]/20 dark:text-[#e86020]',
    'pop-up':          'bg-[#d4920a]/10 text-[#d4920a] dark:bg-[#d4920a]/20 dark:text-[#f0b030]',
    'expo':            'bg-[#0ab0a6]/10 text-[#0ab0a6] dark:bg-[#0ab0a6]/20 dark:text-[#0ab0a6]',
    'pop-ups':         'bg-[#d4920a]/10 text-[#d4920a] dark:bg-[#d4920a]/20 dark:text-[#f0b030]',
    'team-meets':      'bg-[#3850b0]/10 text-[#3850b0] dark:bg-[#3850b0]/20 dark:text-[#7090d8]',
    'food-wine':       'bg-[#b87035]/10 text-[#b87035] dark:bg-[#b87035]/20 dark:text-[#d89050]',
    'entertainment':   'bg-[#8845b5]/10 text-[#8845b5] dark:bg-[#8845b5]/20 dark:text-[#b070d8]',
    'podcast':         'bg-[#507890]/10 text-[#507890] dark:bg-[#507890]/20 dark:text-[#7098b0]',
    'other':           'bg-[#4a5c70]/10 text-[#4a5c70] dark:bg-[#4a5c70]/20 dark:text-[#8098b0]',
};

function getCategoryBadgeColor(slug: string): string {
    return CATEGORY_BADGE_COLORS[slug] ?? CATEGORY_BADGE_COLORS['other'];
}

interface EventCardProps {
    event: Event;
    showFavouriteButton?: boolean;
    className?: string;
}

// Format date from YYYY-MM-DD to DD/MM/YYYY
function formatDate(dateString: string): string {
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
}

export function EventCard({ event, showFavouriteButton = true, className }: EventCardProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const { resolvedAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';
    const isEditor = auth.user?.role === 'editor';
    const editHref = `/events/${event.id}/edit?from=${encodeURIComponent(page.url)}`;

    return (
        <Card
            className={cn(
                'group relative flex h-full flex-col overflow-hidden transition-all hover:shadow-lg',
                event.is_featured && 'ring-2 ring-[#d4920a]/40',
                className,
            )}
        >
            {/* Card Image */}
            <div className="relative h-32 shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                {(() => {
                    const bannerUrl = event.banner_image_url;
                    const sponsorRectUrl = isDark
                        ? (event.sponsor?.logo_rect_dark_url || event.sponsor?.logo_rect_url)
                        : event.sponsor?.logo_rect_url;

                    if (bannerUrl) {
                        return (
                            <img
                                src={bannerUrl}
                                alt={event.title}
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                        );
                    }

                    if (sponsorRectUrl) {
                        return (
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                <img
                                    src={sponsorRectUrl}
                                    alt={event.sponsor?.name}
                                    className="max-h-full max-w-full object-contain"
                                />
                            </div>
                        );
                    }

                    return (
                        <img
                            src={FALLBACK_CYCLING_IMAGE}
                            alt="Cycling event"
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    );
                })()}
                
                {/* Sponsor logo */}
                {event.sponsor && (() => {
                    const logoUrl = isDark
                        ? (event.sponsor.logo_square_dark_url || event.sponsor.logo_square_url)
                        : event.sponsor.logo_square_url;
                    return (
                        <div className="absolute bottom-2 right-2 flex items-center gap-2 rounded-lg bg-white/95 px-2.5 py-2 shadow-md dark:bg-gray-900/95">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={event.sponsor.name}
                                    className="h-10 w-10 object-contain"
                                />
                            ) : (
                                <span className="text-sm font-semibold text-foreground">
                                    {event.sponsor.name}
                                </span>
                            )}
                        </div>
                    );
                })()}

                {/* Editor quick-edit button */}
                {isEditor && (
                    <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2 size-7 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                        asChild
                    >
                        <Link href={editHref}>
                            <Pencil className="size-3.5" />
                        </Link>
                    </Button>
                )}

                {/* Badges positioned over image */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                    {event.is_happening_now && (
                        <Badge className="animate-pulse bg-green-500 text-white shadow-md">
                            <span className="mr-1.5 size-2 rounded-full bg-white" />
                            Live Now
                        </Badge>
                    )}
                    {event.is_featured && (
                        <Badge className="bg-[#d4920a] text-white shadow-md hover:bg-[#b87c08]">
                            <Sparkles className="mr-1 size-3" />
                            Featured
                        </Badge>
                    )}
                    {event.is_recurring && (
                        <Badge className="bg-[#8845b5] text-white shadow-md hover:bg-[#703898]">
                            <Repeat className="mr-1 size-3" />
                            Recurring
                        </Badge>
                    )}
                    {event.is_womens && (
                        <Badge className="bg-pink-500 text-white shadow-md hover:bg-pink-600">
                            Women's
                        </Badge>
                    )}
                </div>
            </div>

            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <Link
                            href={`/events/${event.id}`}
                            className="line-clamp-2 text-lg font-semibold transition-colors hover:text-primary"
                        >
                            {event.title}
                        </Link>
                        {event.sponsor && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {event.sponsor.name}
                            </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {event.category && (
                                <Badge className={cn(getCategoryBadgeColor(event.category.slug), 'hover:opacity-90')}>
                                    {event.category.name}
                                </Badge>
                            )}
                            {event.tags?.map((tag) => (
                                <Badge key={tag.id} variant="outline" className="text-xs">
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3">
                {/* Date & Time */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="size-4" />
                        <span>{event.day_of_week}, {formatDate(event.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="size-4" />
                        <span>{event.start_time} - {event.end_time}</span>
                    </div>
                </div>

                {/* Location */}
                {event.location_name && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="size-4 shrink-0" />
                        <span className="truncate">{event.location_name}</span>
                    </div>
                )}

                {/* Event URL */}
                {event.url && (
                    <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                        <ExternalLink className="size-3.5" />
                        <span className="truncate">Event website</span>
                    </a>
                )}

                {/* Ride Stats */}
                {(event.is_ride || event.route_url) && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        {event.ride_distance_km && (
                            <div className="flex items-center gap-1.5 text-[#0a72bf] dark:text-[#4da6f5]">
                                <Route className="size-4" />
                                <span className="font-medium">{event.ride_distance_km} km</span>
                            </div>
                        )}
                        {event.elevation_gain_m && (
                            <div className="flex items-center gap-1.5 text-[#ff7405] dark:text-[#ff9040]">
                                <Mountain className="size-4" />
                                <span className="font-medium">{event.elevation_gain_m} m</span>
                            </div>
                        )}
                        {event.route_url && (
                            <a
                                href={event.route_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[#0a72bf] hover:underline dark:text-[#4da6f5]"
                            >
                                <MapPin className="size-4 shrink-0" />
                                <span>View route</span>
                            </a>
                        )}
                    </div>
                )}

                {/* Pace */}
                {event.pace && (
                    <div className="flex items-center gap-1.5 text-sm text-[#3850b0] dark:text-[#7090d8]">
                        <Gauge className="size-4 shrink-0" />
                        <span className="font-medium">{event.pace}</span>
                    </div>
                )}

                {/* Description */}
                {event.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                        {event.description}
                    </p>
                )}
            </CardContent>

            <CardFooter className="mt-auto flex shrink-0 items-center justify-between border-t pt-4">
                {/* Cost */}
                <div className="text-sm font-medium">
                    {event.is_free ? (
                        <span className="text-green-600 dark:text-green-400">Free</span>
                    ) : (
                        <span className="text-foreground">{event.cost_formatted}</span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Popularity */}
                    {event.favourites_count !== undefined && event.favourites_count > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="size-4" />
                            <span>{event.favourites_count}</span>
                        </div>
                    )}

                    {/* Favourite Button */}
                    {showFavouriteButton && (
                        <FavouriteButton
                            eventId={event.id}
                            isFavourited={event.is_favourited}
                        />
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}
