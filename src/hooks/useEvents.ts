import { useState, useRef, useCallback } from 'react';
import { EventsService } from '@/services/eventsService';
import { StandardizedEvent, EventFilters } from '@/types/events';

export const useEvents = () => {
  const [events, setEvents] = useState<StandardizedEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<StandardizedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<StandardizedEvent | null>(null);

  // Single EventsService instance
  const eventsServiceRef = useRef(new EventsService());
  // Simple in-memory cache
  const cacheRef = useRef<Record<string, StandardizedEvent[]>>({});

  /** Prefetch next 3 days into cache */
  const prefetchAdjacentDays = useCallback(
    async (date: string, area?: string) => {
      const base = new Date(date);
      for (let i = 1; i <= 3; i++) {
        const next = new Date(base);
        next.setDate(base.getDate() + i);
        const dateStr = next.toISOString().split('T')[0];
        const key = `d:${dateStr}-a:${area ?? 'all'}`;
        if (cacheRef.current[key]) continue;
        try {
          const ev = await eventsServiceRef.current.fetchAllEvents({ date: dateStr, area });
          cacheRef.current[key] = ev;
        } catch {
          console.error('Prefetch failed');
        }
      }
    },
    []
  );

  /** Load one date (with optional filters) */
  const loadEvents = useCallback(
    async (filters?: EventFilters) => {
      const key = filters?.date
        ? `d:${filters.date}-a:${filters.area ?? 'all'}`
        : 'all';

      if (cacheRef.current[key]) {
        const cached = cacheRef.current[key]!;
        setEvents(cached);
        setFilteredEvents(cached);
        if (!selectedEvent && cached.length) setSelectedEvent(cached[0]);
        return;
      }

      setLoading(true);
      try {
        const allEvents = await eventsServiceRef.current.fetchAllEvents(filters);
        cacheRef.current[key] = allEvents;
        setEvents(allEvents);
        setFilteredEvents(allEvents);
        if (allEvents.length && !selectedEvent) setSelectedEvent(allEvents[0]);
        if (filters?.date) prefetchAdjacentDays(filters.date, filters.area);
      } catch {
        console.error('Failed to load events');
      } finally {
        setLoading(false);
      }
    },
    [selectedEvent, prefetchAdjacentDays]
  );

  /** Load events over a date range */
  const loadEventsByDateRange = useCallback(
    async (opts: { start: string; end: string; area?: string }) => {
      const key = `dr:${opts.start}-${opts.end}-a:${opts.area ?? 'all'}`;
      if (cacheRef.current[key]) {
        const cached = cacheRef.current[key]!;
        setEvents(cached);
        setFilteredEvents(cached);
        if (!selectedEvent && cached.length) setSelectedEvent(cached[0]);
        return;
      }

      setLoading(true);
      try {
        const rangeEvents = await eventsServiceRef.current.getEventsByDateRange(
          opts.start, opts.end, opts.area
        );
        cacheRef.current[key] = rangeEvents;
        setEvents(rangeEvents);
        setFilteredEvents(rangeEvents);
        if (rangeEvents.length && !selectedEvent) setSelectedEvent(rangeEvents[0]);
      } catch {
        console.error('Failed to load events in range');
      } finally {
        setLoading(false);
      }
    },
    [selectedEvent]
  );

  /** Client-side filtering */
  const filterEvents = useCallback(
    (filters: { searchTerm?: string; selectedTags?: string[] }) => {
      let results = events;

      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        results = results.filter(e =>
          e.title.toLowerCase().includes(term) ||
          e.description?.toLowerCase().includes(term) ||
          e.location?.toLowerCase().includes(term)
        );
      }

      if (filters.selectedTags?.length) {
        results = results.filter(e =>
          filters.selectedTags!.some(tag =>
            e.tags?.includes(tag) ||
            e.title.toLowerCase().includes(tag) ||
            e.description?.toLowerCase().includes(tag) ||
            e.category?.toLowerCase().includes(tag)
          )
        );
      }

      setFilteredEvents(results);
      if (results.length && (!selectedEvent || !results.some(e => e.id === selectedEvent.id))) {
        setSelectedEvent(results[0]);
      }
    },
    [events, selectedEvent]
  );

  /** Count events on a date for calendar highlights */
  const getEventCountForDate = useCallback(
    (date: Date) => {
      const ds = date.toISOString().split('T')[0];
      return events.filter(e => e.event_date === ds).length;
    },
    [events]
  );

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
