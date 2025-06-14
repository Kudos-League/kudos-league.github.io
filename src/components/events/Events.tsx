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
    const [selectedDateEvents, setSelectedDateEvents] = useState<EventDTO[] | null>(null);

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

    const handleDateClick = ({ start }: { start: Date }) => {
        const selectedDay = new Date(start);
        selectedDay.setHours(0, 0, 0, 0);

        const matched = events.filter((event) => {
            const eventDate = new Date(event.startTime);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === selectedDay.getTime();
        });

        setSelectedDateEvents(matched);
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
            ) : selectedDateEvents ? (
                <div>
                    <button
                        onClick={() => setSelectedDateEvents(null)}
                        className="text-sm text-blue-600 underline mb-4"
                    >
			← Back to calendar
                    </button>

                    <h2 className="text-xl font-semibold mb-2">
			Events on {format(new Date(selectedDateEvents[0]?.startTime || new Date()), 'PPP')}
                    </h2>

                    {selectedDateEvents.length === 0 ? (
                        <p className="text-gray-500 italic">No events on this date.</p>
                    ) : (
                        <ul className="space-y-3">
                            {selectedDateEvents.map((event) => (
                                <li
                                    key={event.id}
                                    onClick={() => navigate(`/event/${event.id}`)}
                                    className="p-3 rounded shadow hover:bg-gray-100 cursor-pointer"
                                >
                                    <p className="font-bold text-lg">{event.title}</p>
                                    <p className="text-gray-600 text-sm mb-1">{event.description}</p>
                                    <p className="text-sm text-gray-500">
                                        {format(new Date(event.startTime), 'p')} –{' '}
                                        {event.endTime ? format(new Date(event.endTime), 'p') : 'Ongoing'}
                                    </p>
                                    {event.location?.name && (
                                        <p className="text-sm text-gray-400">📍 {event.location.name}</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
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
                    onSelectSlot={handleDateClick}
                    selectable
                    ref={calendarRef}
                />
            )}
        </div>
    );
}
