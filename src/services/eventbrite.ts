import { StandardizedEvent } from '@/types/events';
import { inferCategory, generateEventTags } from '@/utils/eventUtils';

/* ------------------------------------------------------------------ */
/*  Minimal typings for the bits of Eventbrite’s response we use      */
/* ------------------------------------------------------------------ */
interface EventbriteEvent {
  id: string;
  name: { text: string | null };
  description: { text: string | null };
  start: { utc: string };
  logo: { url: string | null } | null;
  url: string;
  venue?: { address?: { localized_address_display?: string } };
}

interface EventbriteSearchResponse {
  events: EventbriteEvent[];
  pagination: {
    page_number: number;
    page_size: number;
    page_count: number;
    object_count: number;
  };
}

/* ------------------------------------------------------------------ */

export class EventbriteService {
  // All Eventbrite requests are proxied through the local server so the
  // private OAuth token never reaches the browser.  The Vite dev server
  // proxies "/events" to the Express server defined under ./server.
  private readonly baseUrl = '/events';

  async fetchBerlinEvents(area?: string, page = 1, pageSize = 50) {
    const qs = new URLSearchParams({
      location: 'Berlin',
      page: String(page),
      page_size: String(pageSize),
    });

    try {
      // Requests go to our Express backend which attaches the OAuth token
      const res = await fetch(`${this.baseUrl}/search?${qs}`);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${body}`);
      }

      const json = (await res.json()) as EventbriteSearchResponse;
      let events = this.standardizeEventbriteEvents(json.events);

      if (area) {
        const a = area.toLowerCase();
        events = events.filter((e) => e.location?.toLowerCase().includes(a));
      }
      return events;
    } catch (err) {
      console.error('Eventbrite fetch failed, falling back:', err);
      return this.readLocalEvents(area);
    }
  }

  /* ---------------- Local JSON fallback --------------------------------- */
  private async readLocalEvents(area?: string): Promise<StandardizedEvent[]> {
    const res = await fetch('/data/events.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw: RawLocalEvent[] = await res.json();
    let events = this.standardizeLocalEvents(raw);
    if (area) {
      events = events.filter((e) =>
        e.location?.toLowerCase().includes(area.toLowerCase())
      );
    }
    return events;
  }

  /* ---------------- Mapping helpers ------------------------------------- */
  private standardizeEventbriteEvents(
    events: EventbriteEvent[]
  ): StandardizedEvent[] {
    return events.map((e) => {
      const location =
        e.venue?.address?.localized_address_display ?? 'Berlin, Germany';
      return {
        id: `eb-${e.id}`,
        title: e.name.text ?? 'Event',
        description: e.description.text ?? null,
        event_date: e.start.utc,
        location,
        image_url: e.logo?.url ?? null,
        category: inferCategory(e.name.text ?? '', e.description.text ?? ''),
        tags: generateEventTags({
          title: e.name.text,
          description: e.description.text,
        }),
        source_url: e.url,
        source: 'eventbrite' as const,
      };
    });
  }

  /* Local JSON typing + mapping */
  private standardizeLocalEvents(raw: RawLocalEvent[]): StandardizedEvent[] {
    return raw.map((e) => ({
      id: `local-${e.id}`,
      title: e.title,
      description: e.description ?? null,
      event_date: e.event_date,
      location: e.location ?? null,
      image_url: e.image_url ?? null,
      category: e.category ?? inferCategory(e.title, e.description),
      tags: generateEventTags(e),
      source_url: e.source_url ?? null,
      source: 'local' as const,
    }));
  }
}

/* Minimal type for local JSON entries */
interface RawLocalEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  image_url?: string;
  category?: string;
  source_url?: string;
}
