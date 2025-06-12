
import { useState, useEffect } from 'react';
import { EventsService } from '@/services/eventsService';
import { StandardizedEvent, EventFilters } from '@/types/events';
import { errorLogger } from '@/utils/errorLogger';
import { generateSampleEvents } from '@/utils/sampleData';

export const useEventsWithErrorHandling = () => {
  const [events, setEvents] = useState<StandardizedEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<StandardizedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<StandardizedEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eventsService = new EventsService();

  const loadEvents = async (filters?: EventFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading events with filters:', filters);
      const allEvents = await eventsService.fetchAllEvents(filters);
      
      // Add sample events for testing if no events are found
      const eventsToUse = allEvents.length > 0 ? allEvents : generateSampleEvents();
      
      setEvents(eventsToUse);
      setFilteredEvents(eventsToUse);
      
      // Auto-select first event if none selected
      if (eventsToUse.length > 0 && !selectedEvent) {
        setSelectedEvent(eventsToUse[0]);
      }
      
      console.log('Events loaded successfully:', eventsToUse.length);
    } catch (err) {
      const errorMessage = 'Failed to load events';
      console.error(errorMessage, err);
      errorLogger.logError({
        error: err as Error,
        context: 'LOAD_EVENTS',
        additionalData: { filters }
      });
      setError(errorMessage);
      
      // Fallback to sample data
      const sampleEvents = generateSampleEvents();
      setEvents(sampleEvents);
      setFilteredEvents(sampleEvents);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = (filters: {
    searchTerm?: string;
    selectedTags?: string[];
  }) => {
    try {
      console.log('Filtering events with:', filters);
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
      
      console.log('Events filtered successfully:', filtered.length);
    } catch (err) {
      console.error('Error filtering events:', err);
      errorLogger.logError({
        error: err as Error,
        context: 'FILTER_EVENTS',
        additionalData: { filters }
      });
    }
  };

  const getEventCountForDate = (date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      return events.filter(event => event.event_date === dateStr).length;
    } catch (err) {
      console.error('Error getting event count for date:', err);
      errorLogger.logError({
        error: err as Error,
        context: 'GET_EVENT_COUNT_FOR_DATE',
        additionalData: { date }
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
    getEventCountForDate
  };
};
