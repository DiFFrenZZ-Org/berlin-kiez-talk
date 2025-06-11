
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
  source: 'eventbrite';
}

export class EventbriteService {
  private apiKey: string;
  private baseUrl = 'https://www.eventbriteapi.com/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchBerlinEvents(page = 1, pageSize = 50): Promise<StandardizedEvent[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/events/search/?location.address=Berlin,Germany&expand=venue,category,subcategory&page=${page}&page_size=${pageSize}&token=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Eventbrite API error: ${response.status}`);
      }

      const data: EventbriteResponse = await response.json();
      return this.standardizeEvents(data.events);
    } catch (error) {
      console.error('Failed to fetch Eventbrite events:', error);
      return [];
    }
  }

  private standardizeEvents(events: EventbriteEvent[]): StandardizedEvent[] {
    return events.map(event => ({
      id: `eventbrite-${event.id}`,
      title: event.name.text,
      description: event.description?.text || null,
      event_date: event.start.local.split('T')[0],
      location: event.venue ? `${event.venue.name}, ${event.venue.address.address_1}` : null,
      image_url: event.logo?.url || null,
      category: this.mapCategory(event.category_id),
      tags: this.generateTags(event),
      source_url: event.url,
      source: 'eventbrite'
    }));
  }

  private mapCategory(categoryId: string): string {
    // Map Eventbrite category IDs to our categories
    const categoryMap: Record<string, string> = {
      '103': 'Music',
      '105': 'Performing Arts',
      '110': 'Food & Drink',
      '113': 'Community',
      '116': 'Business',
      '119': 'Film & Media',
      '102': 'Science & Tech',
      '108': 'Sports & Fitness',
      '111': 'Travel & Outdoor',
      '104': 'Fashion',
      '115': 'Charity & Causes'
    };
    return categoryMap[categoryId] || 'Other';
  }

  private generateTags(event: EventbriteEvent): string[] {
    const tags: string[] = [];
    const title = event.name.text.toLowerCase();
    const description = event.description?.text?.toLowerCase() || '';
    const content = `${title} ${description}`;

    // Berlin-specific tags
    const berlinTags = [
      { tag: 'Techno', keywords: ['techno', 'electronic', 'club', 'berghain', 'watergate'] },
      { tag: 'Open-Air', keywords: ['open air', 'outdoor', 'festival', 'park', 'garten'] },
      { tag: 'Festival', keywords: ['festival', 'fest', 'celebration'] },
      { tag: 'Club', keywords: ['club', 'party', 'night', 'dance'] },
      { tag: 'Concert', keywords: ['concert', 'live music', 'band', 'performance'] },
      { tag: 'Art', keywords: ['art', 'gallery', 'exhibition', 'kunst'] },
      { tag: 'Theater', keywords: ['theater', 'theatre', 'play', 'drama'] },
      { tag: 'Food', keywords: ['food', 'restaurant', 'cuisine', 'cooking'] },
      { tag: 'Market', keywords: ['market', 'markt', 'flea', 'vintage'] },
      { tag: 'Kultur', keywords: ['culture', 'kultur', 'cultural'] },
      { tag: 'Dance', keywords: ['dance', 'tanz', 'ballet'] },
      { tag: 'Electronic', keywords: ['electronic', 'edm', 'house', 'trance'] },
      { tag: 'Rock', keywords: ['rock', 'metal', 'punk'] },
      { tag: 'Jazz', keywords: ['jazz', 'blues', 'soul'] },
      { tag: 'Comedy', keywords: ['comedy', 'humor', 'stand-up'] },
      { tag: 'Exhibition', keywords: ['exhibition', 'museum', 'gallery'] },
      { tag: 'Workshop', keywords: ['workshop', 'seminar', 'class'] },
      { tag: 'Sports', keywords: ['sport', 'fitness', 'gym', 'training'] },
      { tag: 'Family', keywords: ['family', 'kids', 'children', 'familie'] }
    ];

    berlinTags.forEach(({ tag, keywords }) => {
      if (keywords.some(keyword => content.includes(keyword))) {
        tags.push(tag);
      }
    });

    return tags;
  }
}
