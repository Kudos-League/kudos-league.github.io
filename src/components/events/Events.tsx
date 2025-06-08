import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { EventDTO } from '@/shared/api/types';
import { getEvents } from '@/shared/api/actions';

const locales = {
    'en-US': require('date-fns/locale/en-US')
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
    getDay,
    locales
});

const months = Array.from({ length: 12 }, (_, i) => ({
    label: format(new Date(0, i), 'MMMM'),
    value: i
}));

export default function EventsPage() {
    const navigate = useNavigate();
    const calendarRef = useRef<any>(null);

    const [events, setEvents] = useState<EventDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getEvents({});
                setEvents(res);
            }
            catch (e) {
                console.error('Failed to fetch events:', e);
            }
            finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const handleMonthChange = (month: number) => {
        const newDate = new Date(currentDate.getFullYear(), month, 1);
        setCurrentDate(newDate);
    };

    const mappedEvents = events.map((event) => ({
        id: event.id,
        title: event.title,
        start: new Date(event.startTime),
        end: event.endTime ? new Date(event.endTime) : new Date(event.startTime),
        allDay: false
    }));

    return (
        <div className="max-w-5xl mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Events Calendar</h1>
                <div className="flex items-center gap-2">
                    <select
                        value={currentDate.getMonth()}
                        onChange={(e) => handleMonthChange(Number(e.target.value))}
                        className="border rounded px-2 py-1"
                    >
                        {months.map((m) => (
                            <option key={m.value} value={m.value}>
                                {m.label}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => navigate('/create-event')}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        + Create Event
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="text-center text-lg">Loading events...</p>
            ) : (
                <Calendar
                    localizer={localizer}
                    events={mappedEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 600 }}
                    defaultView="month"
                    views={['month']}
                    date={currentDate}
                    onNavigate={(date) => setCurrentDate(date)}
                    onSelectEvent={(event) => navigate(`/event/${event.id}`)}
                    ref={calendarRef}
                />
            )}
        </div>
    );
}
