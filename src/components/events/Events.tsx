import React, { useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { EventDTO } from '@/shared/api/types';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import EventCard from './EventCard';

const locales = { 'en-US': require('date-fns/locale/en-US') };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }), getDay, locales });

type Props = { events: EventDTO[] };

export default function Events({ events }: Props) {
    const navigate = useNavigate();
    const calendarRef = useRef<any>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewDate, setViewDate] = useState<Date | null>(null);
    const [selectedDateEvents, setSelectedDateEvents] = useState<EventDTO[] | null>(null);

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    /* ---------- helpers ---------- */
    const findEventsOn = (d: Date) => {
        const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
        const dayEnd   = new Date(dayStart); dayEnd.setHours(23, 59, 59, 999);

        return events.filter(e => {
            const start = toZonedTime(new Date(e.startTime), tz);
            const end   = e.endTime
                ? toZonedTime(new Date(e.endTime), tz)
                : start;                           // single-moment event

            return start <= dayEnd && end >= dayStart;  // **overlap test**
        });
    };

    /* ---------- transforms for RBC ---------- */
    const mappedEvents = useMemo(() => events.map(e => ({
        id: e.id,
        title: e.title,
        start: toZonedTime(new Date(e.startTime), tz),
        end:   toZonedTime(new Date(e.endTime ?? e.startTime), tz),
        allDay: false,
        resource: e       // keep original for later
    })), [events]);

    /* ---------- handlers ---------- */
    const handleDateClick = (slot: SlotInfo) => {
        if (slot.action === 'select' && slot.slots?.length > 1) return;   // clicked inside bar
        const clicked = new Date(slot.start);
        clicked.setHours(0, 0, 0, 0);
        setSelectedDateEvents(findEventsOn(clicked));
        setViewDate(clicked);
    };

    const changeDay = (offset: number) => {
        if (!viewDate) return;                // safety; shouldn’t fire when null
        const newDate = addDays(viewDate, offset);
        setViewDate(newDate);                 // <-- update the heading
        setSelectedDateEvents(findEventsOn(newDate));  // <-- update the list
    };

    /* ---------- render ---------- */
    return (
        <div className="max-w-5xl mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Events Calendar</h1>
                <button onClick={() => navigate('/create-event')} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ Create Event</button>
            </div>

            {/* -------- single day -------- */}
            {selectedDateEvents ? (
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <button onClick={() => changeDay(-1)} className="text-lg">&larr;</button>
                        <h2 className="text-xl font-semibold">
                            {format(viewDate ?? new Date(), 'PPP')}
                        </h2>
                        <button onClick={() => changeDay(1)} className="text-lg">&rarr;</button>
                    </div>

                    <button onClick={() => setSelectedDateEvents(null)} className="text-sm text-blue-600 underline mb-4">← Back to calendar</button>

                    {selectedDateEvents.length === 0 ? (
                        <p className="text-gray-500 italic">No events on this date.</p>
                    ) : (
                        <ul className="space-y-3 list-none">
                            {selectedDateEvents.map(ev => (
                                <EventCard key={ev.id} event={ev} />
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
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 600 }}
                    defaultView="month"
                    views={['month']}
                    date={currentDate}
                    onNavigate={(d) => setCurrentDate(d)}
                    onSelectEvent={(e: any) => navigate(`/event/${e.resource.id}`)}
                    onSelectSlot={handleDateClick}
                    selectable
                    popup                       /* enable “… more” pop-up */
                    onShowMore={(evts: any[], date) => {
                        setCurrentDate(date);
                        setSelectedDateEvents(evts.map(e => e.resource));
                        setViewDate(date);
                    }}
                />
            )}
        </div>
    );
}
