import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import type { CategoryColor, CategorySlug, ScheduleCategory } from '@/types/schedule';

import { TimelineEvent } from './timeline-event';

interface TimelineGridProps {
    categories: ScheduleCategory[];
    startHour: number;
    endHour: number;
    selectedDate: string;
}

// Fixed label column width in px — keep in sync with style={{ width: LABEL_W }} usages below
const LABEL_W = 128;

// Lane layout constants
const LANE_H = 58;   // px allocated per lane
const LANE_PAD = 6;  // top padding inside each row
const CARD_H = 46;   // event card height

// Height of empty category rows (compact, no events)
const EMPTY_ROW_H = 36;

// ─── Colour map ──────────────────────────────────────────────────────────────
// Typed as Record<CategorySlug, CategoryColor> so TypeScript errors if a slug
// is added to the union but its colour entry is missing.
const CATEGORY_COLORS: Record<CategorySlug, CategoryColor> = {
    'race-stages':     { bg: 'bg-[#0a72bf]', lightBg: 'bg-[#0a72bf]/15', border: 'border-[#085fa0]', text: 'text-white' },
    'official-events': { bg: 'bg-[#0a3d7a]', lightBg: 'bg-[#0a3d7a]/15', border: 'border-[#082f62]', text: 'text-white' },
    'watch-parties':   { bg: 'bg-[#2e8fd4]', lightBg: 'bg-[#2e8fd4]/15', border: 'border-[#2478b0]', text: 'text-white' },
    'group-rides':     { bg: 'bg-[#ff7405]', lightBg: 'bg-[#ff7405]/15', border: 'border-[#e06203]', text: 'text-white' },
    'local-racing':    { bg: 'bg-[#c84a00]', lightBg: 'bg-[#c84a00]/15', border: 'border-[#a83c00]', text: 'text-white' },
    'pop-up':          { bg: 'bg-[#d4920a]', lightBg: 'bg-[#d4920a]/15', border: 'border-[#b87c08]', text: 'text-white' },
    'expo':            { bg: 'bg-[#0ab0a6]', lightBg: 'bg-[#0ab0a6]/15', border: 'border-[#08938a]', text: 'text-white' },
    'pop-ups':         { bg: 'bg-[#d4920a]', lightBg: 'bg-[#d4920a]/15', border: 'border-[#b87c08]', text: 'text-white' },
    'team-meets':      { bg: 'bg-[#3850b0]', lightBg: 'bg-[#3850b0]/15', border: 'border-[#2c4298]', text: 'text-white' },
    'food-wine':       { bg: 'bg-[#b87035]', lightBg: 'bg-[#b87035]/15', border: 'border-[#9a5c2a]', text: 'text-white' },
    'entertainment':   { bg: 'bg-[#8845b5]', lightBg: 'bg-[#8845b5]/15', border: 'border-[#703898]', text: 'text-white' },
    'podcast':         { bg: 'bg-[#507890]', lightBg: 'bg-[#507890]/15', border: 'border-[#406070]', text: 'text-white' },
    'other':           { bg: 'bg-[#4a5c70]', lightBg: 'bg-[#4a5c70]/15', border: 'border-[#3a4c5e]', text: 'text-white' },
};

function getCategoryColor(slug: string): CategoryColor {
    return slug in CATEGORY_COLORS
        ? CATEGORY_COLORS[slug as CategorySlug]
        : CATEGORY_COLORS['other'];
}

// Number of hours visible in the viewport at once
const VISIBLE_HOURS = 4;

// ─── Lane layout ─────────────────────────────────────────────────────────────
function calculateRowLayout(events: ScheduleCategory['events']) {
    const sorted = [...events].sort((a, b) => a.start_hour - b.start_hour);
    const lanes: { endHour: number }[] = [];

    return sorted.map((event) => {
        let laneIndex = lanes.findIndex((lane) => lane.endHour <= event.start_hour);
        if (laneIndex === -1) {
            laneIndex = lanes.length;
            lanes.push({ endHour: event.end_hour });
        } else {
            lanes[laneIndex].endHour = event.end_hour;
        }
        return { ...event, lane: laneIndex };
    });
}

// ─── Component ────────────────────────────────────────────────────────────────
export function TimelineGrid({
    categories,
    startHour,
    endHour,
    selectedDate,
}: TimelineGridProps) {
    // Single overflow-auto container — scrollbar sits at the absolute bottom
    const scrollRef = useRef<HTMLDivElement>(null);

    // Derive hour width from the container so exactly VISIBLE_HOURS fill the viewport.
    // ResizeObserver fires once on mount and again whenever the container is resized.
    const [HOUR_WIDTH, setHourWidth] = useState(120);
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            const available = entry.contentRect.width - LABEL_W;
            if (available > 0) setHourWidth(available / VISIBLE_HOURS);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const hours = useMemo(
        () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
        [startHour, endHour],
    );
    const eventsWidth = hours.length * HOUR_WIDTH;
    const totalWidth = LABEL_W + eventsWidth;

    const categoryLayouts = useMemo(
        () => categories.map((cat) => calculateRowLayout(cat.events)),
        [categories],
    );

    // ── Live "now" time — initialised from server prop then updated every minute
    const [liveNow, setLiveNow] = useState(() => new Date());
    useEffect(() => {
        const timer = setInterval(() => setLiveNow(new Date()), 60_000);
        return () => clearInterval(timer);
    }, []);

    // ── NOW indicator position (px from left edge of events area)
    const nowPosition = useMemo(() => {
        const d = liveNow;
        const nowDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (nowDate !== selectedDate) return null;
        const h = d.getHours() + d.getMinutes() / 60;
        if (h < startHour || h > endHour) return null;
        return (h - startHour) * HOUR_WIDTH;
    }, [liveNow, selectedDate, startHour, endHour, HOUR_WIDTH]);

    // ── Scroll to NOW or start of timeline when the date changes
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollLeft = nowPosition !== null ? Math.max(0, nowPosition - 100) : 0;
    }, [selectedDate, nowPosition]);

    return (
        // Single overflow-auto container — scrollbar always at the bottom
        <div ref={scrollRef} className="h-full overflow-auto">
            <div style={{ minWidth: totalWidth }}>

                {/* ── Time header — sticky to top of scroll container ── */}
                <div className="sticky top-0 z-20 flex border-b bg-muted/30">
                    {/* Frozen corner: sticky-left inside sticky-top parent */}
                    <div
                        className="sticky left-0 z-30 shrink-0 border-r bg-background px-2 py-2"
                        style={{ width: LABEL_W }}
                    >
                        <span className="text-[10px] font-medium text-muted-foreground sm:text-xs">
                            Category
                        </span>
                    </div>

                    {/* Hour labels */}
                    <div className="relative flex" style={{ width: eventsWidth }}>
                        {hours.map((hour) => (
                            <div
                                key={hour}
                                className="shrink-0 border-r px-1 py-2 sm:px-2"
                                style={{ width: HOUR_WIDTH }}
                            >
                                <span className="text-[10px] font-medium text-muted-foreground sm:text-xs">
                                    {hour.toString().padStart(2, '0')}:00
                                </span>
                            </div>
                        ))}

                        {/* NOW label in header at the correct hour */}
                        {nowPosition !== null && (
                            <div
                                className="pointer-events-none absolute inset-y-0 w-px bg-red-500"
                                style={{ left: nowPosition }}
                            >
                                <span className="absolute left-1 top-1 rounded bg-red-500 px-1 py-0.5 text-[10px] font-bold leading-none text-white">
                                    NOW
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Category rows ── */}
                {categories.map((cat, idx) => {
                    const layoutEvents = categoryLayouts[idx];
                    const isEmpty = layoutEvents.length === 0;
                    const maxLanes = isEmpty ? 1 : Math.max(1, ...layoutEvents.map((e) => e.lane + 1));
                    const rowHeight = isEmpty
                        ? EMPTY_ROW_H
                        : maxLanes * LANE_H + LANE_PAD * 2;
                    const colors = getCategoryColor(cat.category.slug);

                    return (
                        <div key={cat.category.slug + idx} className="flex border-b">
                            {/* Category label — sticky to the left edge */}
                            <div
                                className={cn(
                                    'sticky left-0 z-20 flex shrink-0 items-center border-r px-1.5 sm:px-2',
                                    isEmpty
                                        ? 'bg-muted/40 text-muted-foreground'
                                        : cn(colors.bg, colors.text),
                                )}
                                style={{ width: LABEL_W, height: rowHeight }}
                            >
                                <span className={cn(
                                    'leading-tight',
                                    isEmpty
                                        ? 'text-[10px] sm:text-[11px]'
                                        : 'text-[10px] font-semibold sm:text-xs lg:text-sm',
                                )}>
                                    {cat.category.name}
                                </span>
                            </div>

                            {/* Events area — overflow-hidden prevents cards spilling into adjacent rows */}
                            <div
                                className={cn(
                                    'relative overflow-hidden',
                                    isEmpty ? 'bg-muted/20' : 'bg-slate-50 dark:bg-transparent',
                                )}
                                style={{ width: eventsWidth, height: rowHeight }}
                            >
                                {/* Hour grid lines */}
                                <div className="pointer-events-none absolute inset-0 flex">
                                    {hours.map((hour) => (
                                        <div
                                            key={hour}
                                            className="shrink-0 border-r border-dashed border-muted-foreground/30"
                                            style={{ width: HOUR_WIDTH }}
                                        />
                                    ))}
                                </div>

                                {/* NOW vertical line (label lives in the header) */}
                                {nowPosition !== null && (
                                    <div
                                        className="pointer-events-none absolute inset-y-0 z-20 w-px bg-red-500"
                                        style={{ left: nowPosition }}
                                    />
                                )}

                                {/* Events */}
                                {layoutEvents.map((event) => (
                                    <TimelineEvent
                                        key={event.id}
                                        event={event}
                                        startHour={startHour}
                                        hourWidth={HOUR_WIDTH}
                                        top={event.lane * LANE_H + LANE_PAD}
                                        cardHeight={CARD_H}
                                        colors={colors}
                                        fromPath={`/schedule?date=${selectedDate}`}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}

            </div>
        </div>
    );
}
