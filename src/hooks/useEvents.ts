import { useState, useRef } from 'react';
import { EventsService } from '@/services/eventsService';
import { StandardizedEvent, EventFilters } from '@/types/events';

export const useEvents = () => {
  const [events, setEvents] = useState<StandardizedEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<StandardizedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<StandardizedEvent | null>(
    null
  );

  const eventsService = new EventsService();
  const cacheRef = useRef<Record<string, StandardizedEvent[]>>({});

  /** Prefetch events for the next three days and store them in cache */
  const prefetchAdjacentDays = async (
    date: string,
    area?: string
  ): Promise<void> => {
    const base = new Date(date);
    for (let i = 1; i <= 3; i++) {
      const next = new Date(base);
      next.setDate(base.getDate() + i);
      const dateStr = next.toISOString().split('T')[0];
      const key = `d:${dateStr}-a:${area ?? 'all'}`;
      if (cacheRef.current[key]) continue;
      try {
        const events = await eventsService.fetchAllEvents({
          date: dateStr,
          area,
        });
        cacheRef.current[key] = events;
      } catch (err) {
        console.error('Prefetch failed', err);
      }
    }
  };

  const loadEvents = async (filters?: EventFilters) => {
    const key = filters?.date
      ? `d:${filters.date}-a:${filters.area ?? 'all'}`
      : 'all';

    if (cacheRef.current[key]) {
      setEvents(cacheRef.current[key]);
      setFilteredEvents(cacheRef.current[key]);
      if (!selectedEvent && cacheRef.current[key].length > 0) {
        setSelectedEvent(cacheRef.current[key][0]);
      }
      return;
    }

    setLoading(true);
    try {
      const allEvents = await eventsService.fetchAllEvents(filters);
      cacheRef.current[key] = allEvents;
      setEvents(allEvents);
      setFilteredEvents(allEvents);

      // Auto-select first event if none selected
      if (allEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(allEvents[0]);
      }

      if (filters?.date) {
        prefetchAdjacentDays(filters.date, filters.area);
      }
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  };

  /** Load events within a specific date range */
  const loadEventsByDateRange = async (opts: {
    start: string;
    end: string;
    area?: string;
  }) => {
    const key = `dr:${opts.start}-${opts.end}-a:${opts.area ?? 'all'}`;
    if (cacheRef.current[key]) {
      setEvents(cacheRef.current[key]);
      setFilteredEvents(cacheRef.current[key]);
      if (!selectedEvent && cacheRef.current[key].length > 0) {
        setSelectedEvent(cacheRef.current[key][0]);
      }
      return;
    }

    setLoading(true);
    try {
      const rangeEvents = await eventsService.getEventsByDateRange(
        opts.start,
        opts.end,
        opts.area,
      );
      cacheRef.current[key] = rangeEvents;
      setEvents(rangeEvents);
      setFilteredEvents(rangeEvents);

      if (rangeEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(rangeEvents[0]);
      }
    } catch (err) {
      console.error('Failed to load events in range', err);
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
      filtered = filtered.filter(
        (event) =>
          event.title
            .toLowerCase()
            .includes(filters.searchTerm!.toLowerCase()) ||
          event.description
            ?.toLowerCase()
            .includes(filters.searchTerm!.toLowerCase()) ||
          event.location
            ?.toLowerCase()
            .includes(filters.searchTerm!.toLowerCase())
      );
    }

    if (filters.selectedTags && filters.selectedTags.length > 0) {
      filtered = filtered.filter((event) =>
        filters.selectedTags!.some(
          (tag) =>
            event.tags?.includes(tag) ||
            event.title.toLowerCase().includes(tag.toLowerCase()) ||
            event.description?.toLowerCase().includes(tag.toLowerCase()) ||
            event.category?.toLowerCase().includes(tag.toLowerCase())
        )
      );
    }

    setFilteredEvents(filtered);

    // Auto-select first event if current selection is not in filtered results
    if (
      filtered.length > 0 &&
      (!selectedEvent || !filtered.find((e) => e.id === selectedEvent.id))
    ) {
      setSelectedEvent(filtered[0]);
    }
  };

  const getEventCountForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((event) => event.event_date === dateStr).length;
  };

  return {
    events,
    filteredEvents,
    loading,
    selectedEvent,
    setSelectedEvent,
    loadEvents,
    loadEventsByDateRange,
    filterEvents,
    getEventCountForDate,
  };
};
