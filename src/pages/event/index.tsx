import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEventDetails, joinEvent, leaveEvent } from '@/shared/api/actions';
import { useAuth } from '@/hooks/useAuth';
import { getAvatarURL } from '@/shared/api/config';
import MapDisplay from '@/components/Map';

export default function EventDetailScreen() {
  const { eventId: id } = useParams<{ eventId: string }>();
  const { user, token } = useAuth();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventId = Number(id);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getEventDetails(eventId);
        setEvent(res.data);
      } catch (e) {
        console.error('Failed to fetch event', e);
        setError("Failed to load event.");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) fetch();
  }, [eventId]);

  const handleJoin = async () => {
    if (!token || !eventId) return;

    setJoining(true);
    try {
      await joinEvent(eventId, token);
      alert("Joined event!");
      setEvent({ ...event, participants: [...(event.participants || []), user] });
    } catch (err: any) {
      alert("Join failed: " + err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!token || !eventId) return;

    try {
      await leaveEvent(eventId, token);
      alert("Left the event!");
      setEvent({
        ...event,
        participants: event.participants.filter((p: any) => p.id !== user?.id),
      });
    } catch (err: any) {
      alert("Leave failed: " + err.message);
    }
  };

  if (loading) return <p className="text-center mt-10 text-lg">Loading event...</p>;
  if (error || !event) return <p className="text-center text-red-500">{error || "Event not found."}</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">{event.title}</h1>
      <p className="text-gray-700">{event.description}</p>
      <p className="text-sm text-gray-500 italic">{event.startTime} – {event.endTime}</p>

      {event.location?.regionID && (
        <div className="my-4">
          <MapDisplay regionID={event.location.regionID} height={200} showAddressBar={false} />
        </div>
      )}

      <h2 className="text-lg font-semibold">Participants</h2>
      <div className="space-y-3">
        {event.participants?.length ? (
          event.participants.map((p: any) => (
            <div key={p.id} className="flex items-center gap-3 border p-2 rounded">
              <img src={getAvatarURL(p.avatar)} alt={p.username} className="w-10 h-10 rounded-full" />
              <span className="font-medium">{p.username}</span>
              {p.id === user?.id && (
                <button
                  onClick={handleLeave}
                  className="ml-auto px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Leave
                </button>
              )}
            </div>
          ))
        ) : (
          <p>No participants yet.</p>
        )}
      </div>

      {!event.participants?.some((p: any) => p.id === user?.id) && (
        <button
          onClick={handleJoin}
          disabled={joining}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {joining ? "Joining..." : "Join Event"}
        </button>
      )}
    </div>
  );
}
