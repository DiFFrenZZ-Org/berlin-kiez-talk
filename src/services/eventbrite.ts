
import { StandardizedEvent, EventbriteEvent, EventbriteResponse } from '@/types/events';
import { inferCategory, generateEventTags } from '@/utils/eventUtils';

export class EventbriteService {
  private baseUrl = 'https://www.eventbriteapi.com/v3';

  async fetchBerlinEvents(area?: string, page = 1, pageSize = 50): Promise<StandardizedEvent[]> {
    try {
      // For now, we'll use the local JSON as we're transitioning to backend API calls
      // This will be replaced with actual Eventbrite API calls via backend
      const response = await fetch('/events.json');
      const data = await response.json();
      
      let events = this.standardizeLocalEvents(data);
      
      // Filter by area if specified
      if (area) {
        events = events.filter(event => 
          event.location?.toLowerCase().includes(area.toLowerCase())
        );
      }
      
      return events;
    } catch (error) {
      console.error('Failed to fetch Eventbrite events:', error);
      return [];
    }
  }

  private standardizeLocalEvents(events: any[]): StandardizedEvent[] {
    return events.map(event => ({
      id: `local-${event.id}`,
      title: event.title,
      description: event.description || null,
      event_date: event.event_date,
      location: event.location || null,
      image_url: event.image_url || null,
      category: event.category || inferCategory(event.title, event.description),
      tags: generateEventTags(event),
      source_url: event.source_url || null,
      source: 'local' as const
    }));
  }
}
