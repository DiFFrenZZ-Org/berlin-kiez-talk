
import { EventbriteService } from './eventbrite';
import { StandardizedEvent, EventFilters } from '@/types/events';
import { removeDuplicateEvents } from '@/utils/eventUtils';
import { supabase } from '@/integrations/supabase/client';
import { BERLIN_AREAS } from '@/constants/berlin';
import { errorLogger } from '@/utils/errorLogger';

export class EventsServiceEnhanced {
  private eventbriteService: EventbriteService;

  constructor() {
    this.eventbriteService = new EventbriteService();
  }

  async fetchAllEvents(filters?: EventFilters): Promise<StandardizedEvent[]> {
    const allEvents: StandardizedEvent[] = [];

    try {
      console.log('Fetching events from all sources...');
      
      // Fetch from different sources with proper error handling
      const sources = await Promise.allSettled([
        this.fetchFromSupabase(filters),
        this.fetchFromEventbrite(filters),
        this.fetchFromLocalJSON(filters)
      ]);

      sources.forEach((result, index) => {
        const sourceName = ['Supabase', 'Eventbrite', 'LocalJSON'][index];
        
        if (result.status === 'fulfilled') {
          console.log(`${sourceName} source returned ${result.value.length} events`);
          allEvents.push(...result.value);
        } else {
          console.error(`${sourceName} source failed:`, result.reason);
          errorLogger.logAPIError(`fetch_${sourceName.toLowerCase()}`, result.reason);
        }
      });

      // Remove duplicates and apply filters
      const uniqueEvents = removeDuplicateEvents(allEvents);
      const filteredEvents = this.applyFilters(uniqueEvents, filters);
      
      console.log(`Returning ${filteredEvents.length} events after deduplication and filtering`);
      return filteredEvents;
      
    } catch (error) {
      console.error('Error in fetchAllEvents:', error);
      errorLogger.logError({
        error: error as Error,
        context: 'FETCH_ALL_EVENTS',
        additionalData: { filters }
      });
      throw error;
    }
  }

  private async fetchFromSupabase(filters?: EventFilters): Promise<StandardizedEvent[]> {
    try {
      console.log('Fetching from Supabase with filters:', filters);
      
      let query = supabase
        .from('berlin_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (filters?.date) {
        query = query.eq('event_date', filters.date);
      }

      const { data, error } = await query;
      
      if (error) {
        errorLogger.logSupabaseError('fetchFromSupabase', error, 'berlin_events');
        throw error;
      }

      const events = (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        event_date: event.event_date,
        location: event.location,
        image_url: event.image_url,
        category: event.category,
        tags: event.tags || [],
        source_url: event.source_url,
        source: 'database' as const
      }));

      console.log(`Fetched ${events.length} events from Supabase`);
      return events;
      
    } catch (error) {
      console.error('Failed to fetch from Supabase:', error);
      errorLogger.logSupabaseError('fetchFromSupabase', error, 'berlin_events');
      return [];
    }
  }

  private async fetchFromEventbrite(filters?: EventFilters): Promise<StandardizedEvent[]> {
    try {
      console.log('Fetching from Eventbrite with area:', filters?.area);
      const events = await this.eventbriteService.fetchBerlinEvents(filters?.area);
      console.log(`Fetched ${events.length} events from Eventbrite`);
      return events;
    } catch (error) {
      console.error('Failed to fetch from Eventbrite:', error);
      errorLogger.logAPIError('fetchFromEventbrite', error, { area: filters?.area });
      return [];
    }
  }

  private async fetchFromLocalJSON(filters?: EventFilters): Promise<StandardizedEvent[]> {
    try {
      console.log('Fetching from local JSON...');
      const response = await fetch('/events.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const events = data.map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        event_date: event.event_date,
        location: event.location,
        image_url: event.image_url || null,
        category: event.category || null,
        tags: event.tags || [],
        source_url: event.source_url || null,
        source: 'local' as const
      }));

      console.log(`Fetched ${events.length} events from local JSON`);
      return events;
      
    } catch (error) {
      console.error('Failed to fetch from local JSON:', error);
      errorLogger.logAPIError('fetchFromLocalJSON', error);
      return [];
    }
  }

  private applyFilters(events: StandardizedEvent[], filters?: EventFilters): StandardizedEvent[] {
    if (!filters) return events;

    try {
      return events.filter(event => {
        if (filters.date && event.event_date !== filters.date) return false;
        if (filters.category && event.category !== filters.category) return false;
        if (filters.tags && filters.tags.length > 0) {
          const hasMatchingTag = filters.tags.some(tag =>
            event.tags.includes(tag) ||
            event.title.toLowerCase().includes(tag.toLowerCase()) ||
            event.description?.toLowerCase().includes(tag.toLowerCase()) ||
            event.category?.toLowerCase().includes(tag.toLowerCase())
          );
          if (!hasMatchingTag) return false;
        }
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          const matchesSearch = 
            event.title.toLowerCase().includes(searchTerm) ||
            event.description?.toLowerCase().includes(searchTerm) ||
            event.location?.toLowerCase().includes(searchTerm);
          if (!matchesSearch) return false;
        }
        return true;
      });
    } catch (error) {
      console.error('Error applying filters:', error);
      errorLogger.logError({
        error: error as Error,
        context: 'APPLY_FILTERS',
        additionalData: { filters, eventCount: events.length }
      });
      return events; // Return unfiltered events if filtering fails
    }
  }

  async getEventsByDate(date: string, area?: string): Promise<StandardizedEvent[]> {
    try {
      return await this.fetchAllEvents({ date, area });
    } catch (error) {
      console.error('Error getting events by date:', error);
      errorLogger.logError({
        error: error as Error,
        context: 'GET_EVENTS_BY_DATE',
        additionalData: { date, area }
      });
      return [];
    }
  }

  async getEventsByDateRange(startDate: string, endDate: string, area?: string): Promise<StandardizedEvent[]> {
    try {
      const allEvents = await this.fetchAllEvents({ area });
      return allEvents.filter(event => 
        event.event_date >= startDate && event.event_date <= endDate
      );
    } catch (error) {
      console.error('Error getting events by date range:', error);
      errorLogger.logError({
        error: error as Error,
        context: 'GET_EVENTS_BY_DATE_RANGE',
        additionalData: { startDate, endDate, area }
      });
      return [];
    }
  }

  getBerlinAreas(): string[] {
    return BERLIN_AREAS;
  }
}
