import { Head, router, usePage } from '@inertiajs/react';
import { Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { EventFilters } from '@/components/events';
import { TimelineGrid } from '@/components/schedule/timeline-grid';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Category, EventFilters as Filters, Tag } from '@/types/events';
import type { ScheduleCategory, TimelineBounds } from '@/types/schedule';

interface ScheduleIndexProps {
    timelineData: ScheduleCategory[];
    selectedDate: string;
    availableDates: string[];
    timelineBounds: TimelineBounds;
    tduYear: number;
    availableYears: number[];
    categories: Category[];
    tags: Tag[];
    filters: Filters;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Schedule', href: '/schedule' },
];

function formatDateShort(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]} ${date.getDate()}`;
}

function formatDateFull(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-AU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export default function ScheduleIndex({
    timelineData,
    selectedDate,
    availableDates,
    timelineBounds,
    tduYear,
    availableYears,
    categories,
    tags,
    filters,
}: ScheduleIndexProps) {
    const { name, festivalName } = usePage<SharedData>().props;
    const [filtersOpen, setFiltersOpen] = useState(false);
    const totalEvents = timelineData.reduce((sum, cat) => sum + cat.events.length, 0);

    const activeFilterCount = Object.values(filters).filter(
        v => v !== undefined && v !== '' && v !== false,
    ).length;
    const currentDateIndex = availableDates.indexOf(selectedDate);
    const hasPrevDate = currentDateIndex > 0;
    const hasNextDate = currentDateIndex < availableDates.length - 1;

    const selectedDateRef = useRef<HTMLButtonElement>(null);
    const dateScrollRef = useRef<HTMLDivElement>(null);
    const dateScrollMounted = useRef(false);

    // On mount: reset to left edge. On subsequent date changes: scroll selected pill into view.
    useEffect(() => {
        if (!dateScrollMounted.current) {
            dateScrollMounted.current = true;
            if (dateScrollRef.current) dateScrollRef.current.scrollLeft = 0;
            return;
        }
        selectedDateRef.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }, [selectedDate]);

    // Keep selected date pill in view when the container resizes (e.g. desktop → mobile)
    useEffect(() => {
        const container = dateScrollRef.current;
        if (!container) return;
        const observer = new ResizeObserver(() => {
            requestAnimationFrame(() => {
                selectedDateRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            });
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    const navigateToDate = (date: string) => {
        router.get('/schedule', { date, year: tduYear }, { preserveState: true });
    };

    const switchYear = (year: number) => {
        router.get('/schedule', year !== availableYears[0] ? { year } : {});
    };

    const goToPrevDate = () => {
        if (hasPrevDate) navigateToDate(availableDates[currentDateIndex - 1]);
    };

    const goToNextDate = () => {
        if (hasNextDate) navigateToDate(availableDates[currentDateIndex + 1]);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Schedule | ${name}`} />

            <div className="flex min-h-0 flex-1 flex-col">
                {/* Header */}
                <div className="shrink-0 border-b bg-gradient-to-br from-[#071e3d] via-[#0d2a50] to-[#0a1a38] px-3 py-3 text-white sm:px-4 sm:py-4">

                    {/* Title row */}
                    <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
                        <div className="flex items-center gap-2.5">
                            <img src="/sidequester_bicycle.svg" alt="" aria-hidden="true" className="h-8 w-auto shrink-0 sm:h-9" />
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Day Schedule</p>
                                <p className="text-sm text-white/80">Plan your {festivalName} race week</p>
                            </div>
                        </div>
                        {totalEvents > 0 && (
                            <span className="shrink-0 rounded-full bg-[#ff7405]/80 px-2.5 py-1 text-xs font-semibold text-white">
                                {totalEvents} event{totalEvents !== 1 ? 's' : ''} today
                            </span>
                        )}
                    </div>

                    {/* TDU year switcher */}
                    {availableYears.length > 1 && (
                        <div className="flex items-center justify-center gap-1">
                            {availableYears.map((year) => (
                                <button
                                    key={year}
                                    onClick={() => switchYear(year)}
                                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors sm:text-sm ${
                                        year === tduYear
                                            ? 'bg-white/20 text-white ring-1 ring-white/40'
                                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {festivalName} {year}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Date navigation */}
                    <div className="mt-2 flex items-center gap-1 sm:mt-3 sm:gap-2">
                        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative size-8 shrink-0 text-white hover:bg-white/20 sm:size-10" aria-label="Filters">
                                    <Filter className="size-4 sm:size-5" />
                                    {activeFilterCount > 0 && (
                                        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[#ff7405] ring-2 ring-[#071e3d]" />
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-md">
                                <SheetHeader>
                                    <SheetTitle>Filters</SheetTitle>
                                    <SheetDescription>Narrow down the events you want to see.</SheetDescription>
                                </SheetHeader>
                                <div className="px-4 pb-4">
                                    <EventFilters
                                        categories={categories}
                                        tags={tags}
                                        currentFilters={filters}
                                        tduYear={tduYear}
                                        availableYears={availableYears}
                                        route="/schedule"
                                        extraParams={{ date: selectedDate }}
                                        hideDateRange
                                        hideSort
                                        onApply={() => setFiltersOpen(false)}
                                        bare
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-white hover:bg-white/20 sm:size-10"
                            onClick={goToPrevDate}
                            disabled={!hasPrevDate}
                        >
                            <ChevronLeft className="size-4 sm:size-5" />
                        </Button>

                        <div ref={dateScrollRef} className="scrollbar-none min-w-0 flex-1 overflow-x-auto">
                            <div className="mx-auto flex w-fit gap-1">
                                {availableDates.map((date) => (
                                    <button
                                        key={date}
                                        ref={date === selectedDate ? selectedDateRef : undefined}
                                        onClick={() => navigateToDate(date)}
                                        className={cn(
                                            'shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all sm:px-4 sm:py-2 sm:text-sm',
                                            date === selectedDate
                                                ? 'bg-[#ff7405] text-white shadow-md'
                                                : 'text-white/90 hover:bg-white/20',
                                        )}
                                    >
                                        {formatDateShort(date)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-white hover:bg-white/20 sm:size-10"
                            onClick={goToNextDate}
                            disabled={!hasNextDate}
                        >
                            <ChevronRight className="size-4 sm:size-5" />
                        </Button>
                    </div>

                    {/* Selected date display */}
                    <p className="mt-1 text-center text-xs text-white/80 sm:mt-2 sm:text-sm">
                        {formatDateFull(selectedDate)}
                    </p>
                </div>

                {/* Timeline Grid */}
                <div className="min-h-0 flex-1 overflow-hidden">
                    {timelineData.length > 0 ? (
                        <TimelineGrid
                            categories={timelineData}
                            startHour={timelineBounds.startHour}
                            endHour={timelineBounds.endHour}
                            selectedDate={selectedDate}
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center p-4">
                            <div className="text-center">
                                <Calendar className="mx-auto mb-4 size-12 text-muted-foreground/30 sm:size-16" />
                                <h3 className="text-lg font-medium">No events on this day</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Select another date to view events
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
