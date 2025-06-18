
import { useState, useRef } from 'react';
import { EventsService } from '@/services/eventsService';
import { StandardizedEvent, EventFilters } from '@/types/events';

const CACHE_PREFIX = 'eventsCache:';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface StoredEvents {
  timestamp: number;
  data: StandardizedEvent[];
}

export const useEvents = () => {
  const [events, setEvents] = useState<StandardizedEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<StandardizedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<StandardizedEvent | null>(null);

  const eventsService = new EventsService();
  const cacheRef = useRef<Record<string, StandardizedEvent[]>>({});

  const loadFromStorage = (key: string) => {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredEvents;
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        cacheRef.current[key] = parsed.data;
        return parsed.data;
      }
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (err) {
      console.error('Failed to parse cached events', err);
    }
    return null;
  };

  const saveToStorage = (key: string, data: StandardizedEvent[]) => {
    if (typeof localStorage === 'undefined') return;
    try {
      const payload: StoredEvents = { timestamp: Date.now(), data };
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(payload));
    } catch (err) {
      console.error('Failed to save events to localStorage', err);
    }
  };

  const loadEvents = async (filters?: EventFilters) => {
    const key = filters?.date
      ? `d:${filters.date}-a:${filters.area ?? 'all'}`
      : 'all';

    let cached = cacheRef.current[key];
    if (!cached) cached = loadFromStorage(key) ?? undefined;

    if (cached) {
      setEvents(cached);
      setFilteredEvents(cached);
      if (!selectedEvent && cached.length > 0) {
        setSelectedEvent(cached[0]);
      }
      return;
    }

    setLoading(true);
    try {
      const allEvents = await eventsService.fetchAllEvents(filters);
      cacheRef.current[key] = allEvents;
      saveToStorage(key, allEvents);
      setEvents(allEvents);
      setFilteredEvents(allEvents);

      // Auto-select first event if none selected
      if (allEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(allEvents[0]);
      }
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = (filters: {
    searchTerm?: string;
    selectedTags?: string[];
  }) => {
    let filtered = events;

    if (filters.searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(filters.searchTerm!.toLowerCase()) ||
        event.description?.toLowerCase().includes(filters.searchTerm!.toLowerCase()) ||
        event.location?.toLowerCase().includes(filters.searchTerm!.toLowerCase())
      );
    }

    if (filters.selectedTags && filters.selectedTags.length > 0) {
      filtered = filtered.filter(event =>
        filters.selectedTags!.some(tag =>
          event.tags?.includes(tag) ||
          event.title.toLowerCase().includes(tag.toLowerCase()) ||
          event.description?.toLowerCase().includes(tag.toLowerCase()) ||
          event.category?.toLowerCase().includes(tag.toLowerCase())
        )
      );
    }

    setFilteredEvents(filtered);
    
    // Auto-select first event if current selection is not in filtered results
    if (filtered.length > 0 && (!selectedEvent || !filtered.find(e => e.id === selectedEvent.id))) {
      setSelectedEvent(filtered[0]);
    }
  };

  const getEventCountForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.event_date === dateStr).length;
  };

  return {
    events,
    filteredEvents,
    loading,
    selectedEvent,
    setSelectedEvent,
    loadEvents,
    filterEvents,
    getEventCountForDate
  };
};
