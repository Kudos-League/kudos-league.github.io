import React, { useEffect, useState } from 'react';
import { View, Text, Button, Image, StyleSheet, ScrollView, Alert } from 'react-native';
import { getEventDetails, joinEvent, leaveEvent } from 'shared/api/actions';
import { useRoute } from '@react-navigation/native';
import { useAuth } from 'shared/hooks/useAuth';
import { getAvatarURL } from 'shared/api/config';
import Map from '../../shared/components/Map';

export default function EventDetailScreen() {
  const route = useRoute();
  const { user, token } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const eventId = (route.params as any)?.id;

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getEventDetails(eventId);
        setEvent(res.data);
      } catch (e) {
        console.error('Failed to fetch event', e);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [eventId]);

  const handleJoin = async () => {
    if (!token) return;

    setJoining(true);
    try {
      await joinEvent(eventId, token);
      Alert.alert("Joined event!");
      setEvent({ ...event, participants: [...(event.participants || []), user] });
    } catch (err) {
      Alert.alert("Join failed", err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!token) return;
  
    try {
      await leaveEvent(eventId, token);
      Alert.alert("Left the event!");
      setEvent({
        ...event,
        participants: event.participants.filter((p: any) => p.id !== user?.id)
      });
    } catch (err) {
      Alert.alert("Leave failed", err.message);
    }
  };  

  if (loading || !event) return <Text>Loading...</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.description}>{event.description}</Text>
      <Text style={styles.date}>{event.startTime} - {event.endTime}</Text>

      {event.location?.regionID && (
        <View style={styles.mapContainer}>
          <Map regionID={event.location.regionID} height={150} />
        </View>
      )}

      <Text style={styles.section}>Participants:</Text>
      {event.participants?.length ? (
        event.participants.map((p: any) => (
          <View key={p.id} style={styles.participant}>
            <Image source={{ uri: getAvatarURL(p.avatar) }} style={styles.avatar} />
            <Text>{p.username}</Text>
            {p.id === user?.id && (
              <Button title="❌" onPress={handleLeave} color="red" />
            )}
          </View>
        ))        
      ) : (
        <Text>No participants yet</Text>
      )}

      {!event.participants?.some((p: any) => p.id === user?.id) && (
        <Button title="Join Event" onPress={handleJoin} disabled={joining} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold' },
  description: { marginTop: 10, fontSize: 16 },
  date: { marginTop: 8, fontStyle: 'italic' },
  section: { marginTop: 20, fontSize: 18, fontWeight: '600' },
  mapContainer: { marginTop: 16 },
  participant: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
});
