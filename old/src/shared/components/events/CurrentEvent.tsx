import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { EventDTO } from 'shared/api/types';
import { getEvents } from 'shared/api/actions';
import dayjs from 'dayjs';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from 'shared/hooks/useAuth';

export default function CurrentEvent() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [locationFilter, setLocationFilter] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | 'all'>('all');

  const getTimeRange = () => {
    const now = new Date();
    switch (timeFilter) {
      case '24h':
        return {
          startDate: dayjs(now).subtract(1, 'day').toISOString(),
          endDate: dayjs(now).toISOString()
        };
      case '7d':
        return {
          startDate: dayjs(now).subtract(7, 'day').toISOString(),
          endDate: dayjs(now).toISOString()
        };
      default:
        return {};
    }
  };

  useEffect(() => {
    const fetch = async () => {
      if (locationFilter && !user?.location?.name) {
        return alert('User has no location set');
      }
  
      const timeRange = getTimeRange();
      const filters: any = {
        ...timeRange,
        ...(locationFilter ? { location: user.location.name } : {})
      };
  
      const response = await getEvents(filters);
      setEvents(response);
      setCurrentIndex(0);
    };
  
    fetch();
  }, [locationFilter, timeFilter, user?.location?.name]);  

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % events.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  const currentEvent = events[currentIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Currently Ongoing Events</Text>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.localButton, locationFilter && styles.localButtonActive]}
          onPress={() => setLocationFilter((prev) => !prev)}
        >
          <Text style={styles.localButtonText}>{locationFilter ? 'Local (On)' : 'Local (Off)'}</Text>
        </TouchableOpacity>

        <Picker
          selectedValue={timeFilter}
          style={styles.picker}
          onValueChange={(itemValue) => setTimeFilter(itemValue)}
        >
          <Picker.Item label="All Time" value="all" />
          <Picker.Item label="Last 24 Hours" value="24h" />
          <Picker.Item label="Last 7 Days" value="7d" />
        </Picker>
      </View>

      {events.length > 0 ? (
        <View style={styles.carouselContainer}>
          <TouchableOpacity style={styles.arrowButton} onPress={handlePrev}>
            <Text style={styles.arrowText}>{'<'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.eventCard}
            onPress={() => navigation.navigate('Event', { id: currentEvent.id })}
          >
            <Text style={styles.eventTitle}>{currentEvent.title}</Text>
            <Text style={styles.eventDescription}>{currentEvent.description}</Text>
            <Text style={styles.eventDates}>
              {dayjs(currentEvent.startTime).format('MMM D, YYYY h:mm A')} -{' '}
              {dayjs(currentEvent.endTime).format('MMM D, YYYY h:mm A')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.arrowButton} onPress={handleNext}>
            <Text style={styles.arrowText}>{'>'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.noEventText}>No events match your filter.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 10, paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  carouselContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  arrowButton: { padding: 12 },
  arrowText: { fontSize: 20, fontWeight: 'bold' },
  eventCard: {
    minWidth: 200,
    maxWidth: 300,
    padding: 16,
    backgroundColor: '#f9f9f9',
    marginHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  eventTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  eventDescription: { fontSize: 14, marginBottom: 6, textAlign: 'center' },
  eventDates: { fontSize: 12, color: '#666' },
  noEventText: { fontSize: 16, fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  localButton: {
    padding: 8,
    backgroundColor: '#888',
    borderRadius: 6,
  },
  localButtonActive: {
    backgroundColor: '#4caf50',
  },
  localButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  picker: {
    height: 40,
    width: 150,
  },
});
