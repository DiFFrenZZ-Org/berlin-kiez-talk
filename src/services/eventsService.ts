
import { EventbriteService } from './eventbrite';
import { StandardizedEvent, EventFilters } from '@/types/events';
import { removeDuplicateEvents } from '@/utils/eventUtils';
import { supabase } from '@/integrations/supabase/client';
import { BERLIN_AREAS } from '@/constants/berlin';

export class EventsService {
  private eventbriteService: EventbriteService;

  constructor() {
    this.eventbriteService = new EventbriteService();
  }

  async fetchAllEvents(filters?: EventFilters): Promise<StandardizedEvent[]> {
    const allEvents: StandardizedEvent[] = [];

    // Fetch from different sources
    const sources = await Promise.allSettled([
      this.fetchFromSupabase(filters),
      this.fetchFromEventbrite(filters),
      this.fetchFromLocalJSON(filters)
    ]);

    sources.forEach((result) => {
      if (result.status === 'fulfilled') {
        allEvents.push(...result.value);
      }
    });

    // Remove duplicates and apply filters
    const uniqueEvents = removeDuplicateEvents(allEvents);
    return this.applyFilters(uniqueEvents, filters);
  }

  private async fetchFromSupabase(filters?: EventFilters): Promise<StandardizedEvent[]> {
    try {
      let query = supabase
        .from('berlin_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (filters?.date) {
        query = query.eq('event_date', filters.date);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(event => ({
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
    } catch (error) {
      console.error('Failed to fetch from Supabase:', error);
      return [];
    }
  }

  private async fetchFromEventbrite(filters?: EventFilters): Promise<StandardizedEvent[]> {
    try {
      return await this.eventbriteService.fetchBerlinEvents(filters?.area);
    } catch (error) {
      console.error('Failed to fetch from Eventbrite:', error);
      return [];
    }
  }

  private async fetchFromLocalJSON(filters?: EventFilters): Promise<StandardizedEvent[]> {
    try {
      const response = await fetch('/events.json');
      const data = await response.json();
      
      return data.map((event: any) => ({
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
    } catch (error) {
      console.error('Failed to fetch from local JSON:', error);
      return [];
    }
  }

  private applyFilters(events: StandardizedEvent[], filters?: EventFilters): StandardizedEvent[] {
    if (!filters) return events;

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
  }

  async getEventsByDate(date: string, area?: string): Promise<StandardizedEvent[]> {
    return this.fetchAllEvents({ date, area });
  }

  async getEventsByDateRange(startDate: string, endDate: string, area?: string): Promise<StandardizedEvent[]> {
    const allEvents = await this.fetchAllEvents({ area });
    return allEvents.filter(event => 
      event.event_date >= startDate && event.event_date <= endDate
    );
  }

  getBerlinAreas(): string[] {
    return BERLIN_AREAS;
  }
}
