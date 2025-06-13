
import { useState } from 'react';
import { EventsService } from '@/services/eventsService';
import { StandardizedEvent, EventFilters } from '@/types/events';

export const useEvents = () => {
  const [events, setEvents] = useState<StandardizedEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<StandardizedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<StandardizedEvent | null>(null);

  const eventsService = new EventsService();

  const loadEvents = async (filters?: EventFilters) => {
    setLoading(true);
    try {
      const allEvents = await eventsService.fetchAllEvents(filters);
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
