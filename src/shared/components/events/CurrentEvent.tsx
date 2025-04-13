import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EventDTO } from 'shared/api/types';
import { getEvents } from 'shared/api/actions';
import dayjs from 'dayjs';
import { useNavigation } from '@react-navigation/native';

export default function CurrentEvent() {
  const navigation = useNavigation();
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const response = await getEvents();
        setEvents(response);
        setCurrentIndex(0);
      } catch (err) {
        console.warn('Failed to fetch events:', err);
      }
    };

    fetchAllEvents();
  }, []);

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      return next >= events?.length ? 0 : next;
    });
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => {
      const next = prev - 1;
      return next < 0 ? events?.length - 1 : next;
    });
  };

  if (!events?.length) {
    return (
      <View style={styles.noEventContainer}>
        <Text style={styles.noEventText}>No current events right now.</Text>
      </View>
    );
  }

  const currentEvent = events?.[currentIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Currently Ongoing Events</Text>
      <View style={styles.carouselContainer}>
        <TouchableOpacity style={styles.arrowButton} onPress={handlePrev}>
          <Text style={styles.arrowText}>{'<'}</Text>
        </TouchableOpacity>

        <View style={styles.eventCard}>
          <TouchableOpacity style={styles.eventCard} onPress={() => navigation.navigate('Event', { id: currentEvent.id })}>
            <Text style={styles.eventTitle}>{currentEvent.title}</Text>
          </TouchableOpacity>
          <Text style={styles.eventDescription}>{currentEvent.description}</Text>
          <Text style={styles.eventDates}>
            {dayjs(currentEvent.startTime).format('MMM D, YYYY h:mm A')} -{' '}
            {dayjs(currentEvent.endTime).format('MMM D, YYYY h:mm A')}
          </Text>
        </View>

        <TouchableOpacity style={styles.arrowButton} onPress={handleNext}>
          <Text style={styles.arrowText}>{'>'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  carouselContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowButton: {
    padding: 12,
  },
  arrowText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  eventCard: {
    minWidth: 200,
    maxWidth: 300,
    padding: 16,
    backgroundColor: '#f9f9f9',
    marginHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  eventTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    marginBottom: 6,
    textAlign: 'center',
  },
  eventDates: {
    fontSize: 12,
    color: '#666',
  },
  noEventContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noEventText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
});
