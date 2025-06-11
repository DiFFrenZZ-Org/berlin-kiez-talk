
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

export interface EventFilters {
  date?: string;
  tags?: string[];
  search?: string;
  category?: string;
  area?: string;
}

export interface EventbriteEvent {
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

export interface EventbriteResponse {
  events: EventbriteEvent[];
  pagination: {
    page_number: number;
    page_count: number;
    page_size: number;
    object_count: number;
  };
}
