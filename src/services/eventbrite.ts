import { StandardizedEvent } from "@/types/events";
import { inferCategory, generateEventTags } from "@/utils/eventUtils";

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
  private baseUrl = "https://www.eventbriteapi.com/v3";
  private token = import.meta.env.VITE_EVENTBRITE_PRIVATE_TOKEN;

  /** Fetch events happening in Berlin via Eventbrite Search API */
  async fetchBerlinEvents(
    area?: string,
    page = 1,
    pageSize = 50
  ): Promise<StandardizedEvent[]> {
    if (!this.token) {
      console.warn("Eventbrite token missing – using local fallback.");
      return this.readLocalEvents(area);
    }

    const searchParams = new URLSearchParams({
      "location.address": "Berlin",
      "expand": "venue",
      "page": String(page),
      "page_size": String(pageSize),
    });

    try {
      const res = await fetch(`${this.baseUrl}/events/search/?${searchParams}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json: EventbriteSearchResponse = await res.json();
      let events = this.standardizeEventbriteEvents(json.events);

      if (area) {
        events = events.filter((e) =>
          e.location?.toLowerCase().includes(area.toLowerCase())
        );
      }
      return events;
    } catch (err) {
      console.error("Eventbrite fetch failed, falling back:", err);
      return this.readLocalEvents(area);
    }
  }

  /* ---------------- Local JSON fallback --------------------------------- */
  private async readLocalEvents(area?: string): Promise<StandardizedEvent[]> {
    const res = await fetch("/events.json");
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
        e.venue?.address?.localized_address_display ?? "Berlin, Germany";
      return {
        id: `eb-${e.id}`,
        title: e.name.text ?? "Event",
        description: e.description.text ?? null,
        event_date: e.start.utc,
        location,
        image_url: e.logo?.url ?? null,
        category: inferCategory(e.name.text ?? "", e.description.text ?? ""),
        tags: generateEventTags({ title: e.name.text, description: e.description.text }),
        source_url: e.url,
        source: "eventbrite" as const,
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
      source: "local" as const,
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
