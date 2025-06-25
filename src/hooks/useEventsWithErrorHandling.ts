import { useState, useCallback, useEffect } from "react";
import { EventsService } from "@/services/eventsService";
import { StandardizedEvent, EventFilters } from "@/types/events";
import { errorLogger } from "@/utils/errorLogger";
import { generateSampleEvents } from "@/utils/sampleData";

/** A very small helper so we never cast to `any` */
interface RawError { message?: string; stack?: string; [k: string]: unknown }

export const useEventsWithErrorHandling = () => {
  const [events, setEvents] = useState<StandardizedEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<StandardizedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<StandardizedEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eventsService = new EventsService();

  /* ------------------------------------------------------------------ */
  /*  Load events (wrapped in useCallback so ESLint is happy)           */
  /* ------------------------------------------------------------------ */
  const loadEvents = useCallback(
    async (filters?: EventFilters) => {
      setLoading(true);
      setError(null);

      try {
        const allEvents = await eventsService.fetchAllEvents(filters);
        const eventsToUse = allEvents.length ? allEvents : generateSampleEvents();

        setEvents(eventsToUse);
        setFilteredEvents(eventsToUse);

        if (!selectedEvent && eventsToUse.length) {
          setSelectedEvent(eventsToUse[0]);
        }
      } catch (err) {
        const raw = err as RawError;
        setError("Failed to load events");
        errorLogger.logError({
          error: raw,
          context: "LOAD_EVENTS",
          additionalData: { filters },
        });
        const sample = generateSampleEvents();
        setEvents(sample);
        setFilteredEvents(sample);
      } finally {
        setLoading(false);
      }
    },
    [eventsService, selectedEvent]
  );

  /* Auto-load once on mount */
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  /* ------------------------------------------------------------------ */
  /*  Client-side filtering                                             */
  /* ------------------------------------------------------------------ */
  const filterEvents = (filters: { searchTerm?: string; selectedTags?: string[] }) => {
    try {
      let filtered = events;

      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.title.toLowerCase().includes(term) ||
            e.description?.toLowerCase().includes(term) ||
            e.location?.toLowerCase().includes(term)
        );
      }

      if (filters.selectedTags?.length) {
        filtered = filtered.filter((e) =>
          filters.selectedTags!.some(
            (tag) =>
              e.tags?.includes(tag) ||
              e.title.toLowerCase().includes(tag.toLowerCase()) ||
              e.description?.toLowerCase().includes(tag.toLowerCase()) ||
              e.category?.toLowerCase().includes(tag.toLowerCase())
          )
        );
      }

      setFilteredEvents(filtered);

      if (filtered.length && (!selectedEvent || !filtered.some((e) => e.id === selectedEvent.id))) {
        setSelectedEvent(filtered[0]);
      }
    } catch (err) {
      errorLogger.logError({
        error: err as RawError,
        context: "FILTER_EVENTS",
        additionalData: { filters },
      });
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Calendar helper                                                   */
  /* ------------------------------------------------------------------ */
  const getEventCountForDate = (date: Date) => {
    try {
      const key = date.toISOString().split("T")[0];
      return events.filter((e) => e.event_date === key).length;
    } catch (err) {
      errorLogger.logError({
        error: err as RawError,
        context: "GET_EVENT_COUNT_FOR_DATE",
        additionalData: { date },
      });
      return 0;
    }
  };

  return {
    events,
    filteredEvents,
    loading,
    selectedEvent,
    error,
    setSelectedEvent,
    loadEvents,
    filterEvents,
    getEventCountForDate,
  };
};
