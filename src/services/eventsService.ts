
import { EventbriteService, StandardizedEvent } from './eventbrite';
import { supabase } from '@/integrations/supabase/client';

interface EventFilters {
  date?: string;
  tags?: string[];
  search?: string;
  category?: string;
}

export class EventsService {
  private eventbriteService: EventbriteService | null = null;

  constructor(eventbriteApiKey?: string) {
    if (eventbriteApiKey) {
      this.eventbriteService = new EventbriteService(eventbriteApiKey);
    }
  }

  async fetchAllEvents(filters?: EventFilters): Promise<StandardizedEvent[]> {
    const allEvents: StandardizedEvent[] = [];

    // Fetch from different sources
    const sources = await Promise.allSettled([
      this.fetchFromSupabase(),
      this.fetchFromEventbrite(),
      this.fetchFromLocalJSON()
    ]);

    sources.forEach((result) => {
      if (result.status === 'fulfilled') {
        allEvents.push(...result.value);
      }
    });

    // Remove duplicates based on title and date
    const uniqueEvents = this.removeDuplicates(allEvents);

    // Apply filters
    return this.applyFilters(uniqueEvents, filters);
  }

  private async fetchFromSupabase(): Promise<StandardizedEvent[]> {
    try {
      const { data, error } = await supabase
        .from('berlin_events')
        .select('*')
        .order('event_date', { ascending: true });

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

  private async fetchFromEventbrite(): Promise<StandardizedEvent[]> {
    if (!this.eventbriteService) {
      return [];
    }

    try {
      return await this.eventbriteService.fetchBerlinEvents();
    } catch (error) {
      console.error('Failed to fetch from Eventbrite:', error);
      return [];
    }
  }

  private async fetchFromLocalJSON(): Promise<StandardizedEvent[]> {
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

  private removeDuplicates(events: StandardizedEvent[]): StandardizedEvent[] {
    const seen = new Set<string>();
    return events.filter(event => {
      const key = `${event.title}-${event.event_date}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private applyFilters(events: StandardizedEvent[], filters?: EventFilters): StandardizedEvent[] {
    if (!filters) return events;

    return events.filter(event => {
      // Date filter
      if (filters.date && event.event_date !== filters.date) {
        return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag =>
          event.tags.includes(tag) ||
          event.title.toLowerCase().includes(tag.toLowerCase()) ||
          event.description?.toLowerCase().includes(tag.toLowerCase()) ||
          event.category?.toLowerCase().includes(tag.toLowerCase())
        );
        if (!hasMatchingTag) return false;
      }

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          event.title.toLowerCase().includes(searchTerm) ||
          event.description?.toLowerCase().includes(searchTerm) ||
          event.location?.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category && event.category !== filters.category) {
        return false;
      }

      return true;
    });
  }

  async getEventsByDate(date: string): Promise<StandardizedEvent[]> {
    return this.fetchAllEvents({ date });
  }

  async getEventsByDateRange(startDate: string, endDate: string): Promise<StandardizedEvent[]> {
    const allEvents = await this.fetchAllEvents();
    return allEvents.filter(event => 
      event.event_date >= startDate && event.event_date <= endDate
    );
  }
}
