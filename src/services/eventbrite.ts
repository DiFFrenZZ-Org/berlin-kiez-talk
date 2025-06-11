
interface EventbriteEvent {
  id: string;
  name: {
    text: string;
  };
  description: {
    text: string;
  } | null;
  start: {
    utc: string;
    local: string;
  };
  end: {
    utc: string;
    local: string;
  };
  venue: {
    name: string;
    address: {
      address_1: string;
      city: string;
      region: string;
    };
  } | null;
  logo: {
    url: string;
  } | null;
  url: string;
  category_id: string;
  subcategory_id: string;
  tags: string[];
}

interface EventbriteResponse {
  events: EventbriteEvent[];
  pagination: {
    page_number: number;
    page_count: number;
    page_size: number;
    object_count: number;
  };
}

export interface StandardizedEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  image_url: string | null;
  category: string | null;
  tags: string[];
  source_url: string;
  source: 'eventbrite' | 'database' | 'local';
}

export class EventbriteService {
  private baseUrl = 'https://www.eventbriteapi.com/v3';

  constructor() {
    // API key will be handled via environment variables on the backend
  }

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
      category: event.category || this.inferCategory(event.title, event.description),
      tags: this.generateTags(event),
      source_url: event.source_url || null,
      source: 'local' as const
    }));
  }

  private inferCategory(title: string, description: string = ''): string {
    const content = `${title} ${description}`.toLowerCase();
    
    if (content.includes('music') || content.includes('concert') || content.includes('band')) return 'Music';
    if (content.includes('art') || content.includes('gallery') || content.includes('exhibition')) return 'Art';
    if (content.includes('food') || content.includes('restaurant') || content.includes('cuisine')) return 'Food & Drink';
    if (content.includes('tech') || content.includes('startup') || content.includes('digital')) return 'Science & Tech';
    if (content.includes('sport') || content.includes('fitness') || content.includes('yoga')) return 'Sports & Fitness';
    if (content.includes('theater') || content.includes('play') || content.includes('drama')) return 'Performing Arts';
    
    return 'Other';
  }

  private generateTags(event: any): string[] {
    const tags: string[] = [];
    const title = event.title?.toLowerCase() || '';
    const description = event.description?.toLowerCase() || '';
    const location = event.location?.toLowerCase() || '';
    const content = `${title} ${description} ${location}`;

    // Berlin area tags
    const areaTags = [
      { tag: 'Mitte', keywords: ['mitte', 'alexanderplatz', 'potsdamer platz'] },
      { tag: 'Kreuzberg', keywords: ['kreuzberg', 'görlitzer'] },
      { tag: 'Friedrichshain', keywords: ['friedrichshain', 'warschauer', 'boxhagener'] },
      { tag: 'Prenzlauer Berg', keywords: ['prenzlauer berg', 'kollwitzplatz'] },
      { tag: 'Neukölln', keywords: ['neukölln', 'tempelhof'] },
      { tag: 'Charlottenburg', keywords: ['charlottenburg', 'savignyplatz'] },
      { tag: 'Schöneberg', keywords: ['schöneberg', 'nollendorfplatz'] }
    ];

    // Event type tags
    const eventTypeTags = [
      { tag: 'Techno', keywords: ['techno', 'electronic', 'club', 'berghain', 'watergate'] },
      { tag: 'Open-Air', keywords: ['open air', 'outdoor', 'festival', 'park', 'garten'] },
      { tag: 'Festival', keywords: ['festival', 'fest', 'celebration'] },
      { tag: 'Club', keywords: ['club', 'party', 'night', 'dance'] },
      { tag: 'Concert', keywords: ['concert', 'live music', 'band', 'performance'] },
      { tag: 'Art', keywords: ['art', 'gallery', 'exhibition', 'kunst'] },
      { tag: 'Theater', keywords: ['theater', 'theatre', 'play', 'drama'] },
      { tag: 'Food', keywords: ['food', 'restaurant', 'cuisine', 'cooking'] },
      { tag: 'Market', keywords: ['market', 'markt', 'flea', 'vintage'] }
    ];

    [...areaTags, ...eventTypeTags].forEach(({ tag, keywords }) => {
      if (keywords.some(keyword => content.includes(keyword))) {
        tags.push(tag);
      }
    });

    return tags;
  }
}
