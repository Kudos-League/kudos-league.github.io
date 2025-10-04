import React, { useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer, SlotInfo } from 'react-big-calendar';
import {
    format,
    parse,
    startOfWeek,
    getDay,
    addDays,
    addYears
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { EventDTO } from '@/shared/api/types';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import EventCard from './EventCard';
import Button from '../common/Button';

const locales = { 'en-US': require('date-fns/locale/en-US') };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
    getDay,
    locales
});

type Props = { events: EventDTO[] };

export default function Events({ events }: Props) {
    const navigate = useNavigate();
    const calendarRef = useRef<any>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewDate, setViewDate] = useState<Date | null>(null);
    const [selectedDateEvents, setSelectedDateEvents] = useState<
        EventDTO[] | null
    >(null);

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const recurringEventIds = useMemo(() => {
        const groups = new Map<string, EventDTO[]>();

        events.forEach((event) => {
            const key = [
                event.creatorID ?? 'unknown',
                (event.title || '').trim().toLowerCase(),
                (event.description || '').trim().toLowerCase()
            ].join('|');

            const list = groups.get(key) ?? [];
            list.push(event);
            groups.set(key, list);
        });

        const ids = new Set<number>();
        groups.forEach((list) => {
            if (list.length > 1) {
                list.forEach((ev) => ids.add(ev.id));
            }
        });

        return ids;
    }, [events]);

    /* ---------- helpers ---------- */
    const findEventsOn = (d: Date) => {
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        return events.filter((e) => {
            const start = toZonedTime(new Date(e.startTime), tz);
            const end = e.endTime ? toZonedTime(new Date(e.endTime), tz) : null; // For infinite events, we'll check differently

            // For infinite events (no end time), check if the day is after start
            if (!end) {
                return start <= dayEnd;
            }

            // For normal events, check overlap
            return start <= dayEnd && end >= dayStart;
        });
    };

    /* ---------- transforms for RBC ---------- */
    const mappedEvents = useMemo(
        () =>
            events.map((e) => {
                const startDate = toZonedTime(new Date(e.startTime), tz);
                let endDate;

                if (e.endTime) {
                    endDate = toZonedTime(new Date(e.endTime), tz);
                }
                else {
                    endDate = addYears(startDate, 1);
                }

                const isRecurring = recurringEventIds.has(e.id);
                const baseTitle = e.endTime ? e.title : `${e.title} (Ongoing)`;

                return {
                    id: e.id,
                    title: baseTitle,
                    start: startDate,
                    end: endDate,
                    allDay: false,
                    resource: {
                        ...e,
                        isRecurring
                    }
                };
            }),
        [events, tz, recurringEventIds]
    );

    const eventPropGetter = useCallback((calendarEvent: any) => {
        if (calendarEvent?.resource?.isRecurring) {
            return {
                style: {
                    borderLeft: '4px solid #2563eb',
                    boxShadow: 'inset 0 0 0 1px rgba(37, 99, 235, 0.35)',
                    backgroundImage:
                        'repeating-linear-gradient(135deg, rgba(59,130,246,0.22), rgba(59,130,246,0.22) 6px, rgba(191,219,254,0.35) 6px, rgba(191,219,254,0.35) 12px)'
                },
                className: 'rbc-event-recurring'
            };
        }

        return {};
    }, []);

    const calendarComponents = useMemo(
        () => ({
            event: ({ event }: { event: any }) => (
                <div className='flex items-center gap-1 truncate'>
                    {event?.resource?.isRecurring && (
                        <span className='px-1.5 py-0.5 text-[10px] leading-3 font-semibold uppercase tracking-wide text-white bg-blue-600 rounded-sm'>↻</span>
                    )}
                    <span className='truncate'>{event.title}</span>
                </div>
            )
        }),
        []
    );

    /* ---------- handlers ---------- */
    const handleDateClick = (slot: SlotInfo) => {
        if (slot.action === 'select' && slot.slots?.length > 1) return; // clicked inside bar
        const clicked = new Date(slot.start);
        clicked.setHours(0, 0, 0, 0);
        setSelectedDateEvents(findEventsOn(clicked));
        setViewDate(clicked);
    };

    const changeDay = (offset: number) => {
        if (!viewDate) return; // safety; shouldn't fire when null
        const newDate = addDays(viewDate, offset);
        setViewDate(newDate); // <-- update the heading
        setSelectedDateEvents(findEventsOn(newDate)); // <-- update the list
    };

    /* ---------- render ---------- */
    return (
        <div className='max-w-5xl mx-auto p-4'>
            <div className='flex justify-between items-center mb-4'>
                <h1 className='text-2xl font-bold'>Events Calendar</h1>
                <Button onClick={() => navigate('/create-event')}>
                    + Create Event
                </Button>
            </div>

            {/* -------- single day -------- */}
            {selectedDateEvents ? (
                <div>
                    <div className='flex items-center gap-4 mb-2'>
                        <Button
                            onClick={() => changeDay(-1)}
                            className='text-lg'
                        >
                            &larr;
                        </Button>
                        <h2 className='text-xl font-semibold'>
                            {format(viewDate ?? new Date(), 'PPP')}
                        </h2>
                        <Button
                            onClick={() => changeDay(1)}
                            className='text-lg'
                        >
                            &rarr;
                        </Button>
                    </div>

                    <Button onClick={() => setSelectedDateEvents(null)}>
                        ← Back to calendar
                    </Button>

                    {selectedDateEvents.length === 0 ? (
                        <p className='text-gray-500 italic'>
                            No events on this date.
                        </p>
                    ) : (
                        <ul className='space-y-3 list-none'>
                            {selectedDateEvents.map((ev) => (
                                <EventCard
                                    key={ev.id}
                                    event={ev}
                                    isRecurring={recurringEventIds.has(ev.id)}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            ) : (
                /* -------- month grid -------- */
                <Calendar
                    ref={calendarRef}
                    localizer={localizer}
                    events={mappedEvents}
                    startAccessor='start'
                    endAccessor='end'
                    style={{ height: 600 }}
                    defaultView='month'
                    views={['month']}
                    date={currentDate}
                    onNavigate={(d) => setCurrentDate(d)}
                    onSelectEvent={(e: any) =>
                        navigate(`/event/${e.resource.id}`)
                    }
                    onSelectSlot={handleDateClick}
                    selectable
                    popup /* enable "… more" pop-up */
                    eventPropGetter={eventPropGetter}
                    components={calendarComponents}
                    onShowMore={(evts: any[], date) => {
                        setCurrentDate(date);
                        setSelectedDateEvents(evts.map((e) => e.resource));
                        setViewDate(date);
                    }}
                />
            )}
        </div>
    );
}
