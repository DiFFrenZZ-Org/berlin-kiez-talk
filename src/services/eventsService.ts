import { EventbriteService } from "./eventbrite";
import { StandardizedEvent, EventFilters } from "@/types/events";
import { removeDuplicateEvents } from "@/utils/eventUtils";
import { supabase } from "@/integrations/supabase/client";
import { BERLIN_AREAS } from "@/constants/berlin";

// ---- local-JSON shape – no `any` -----------------------------------
interface LocalJsonEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  image_url?: string;
  category?: string;
  tags?: string[];
  source_url?: string;
}

export class EventsService {
  private eventbriteService = new EventbriteService();

  async fetchAllEvents(filters?: EventFilters): Promise<StandardizedEvent[]> {
    const all: StandardizedEvent[] = [];

    const results = await Promise.allSettled([
      this.fetchFromSupabase(filters),
      this.fetchFromEventbrite(filters),
      this.fetchFromLocalJSON(filters),
    ]);

    results.forEach((r) => r.status === "fulfilled" && all.push(...r.value));

    return this.applyFilters(removeDuplicateEvents(all), filters);
  }

  // ---- Supabase ----------------------------------------------------
  private async fetchFromSupabase(
    filters?: EventFilters,
  ): Promise<StandardizedEvent[]> {
    try {
      let q = supabase
        .from("berlin_events")
        .select("*")
        .order("event_date");

      if (filters?.date) q = q.eq("event_date", filters.date);

      const { data, error } = await q;
      if (error) throw error;

      return (data ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        event_date: e.event_date,
        location: e.location,
        image_url: e.image_url,
        category: e.category,
        tags: e.tags ?? [],
        source_url: e.source_url,
        source: "database" as const,
      }));
    } catch (err: unknown) {
      console.error("Supabase fetch failed:", err);
      return [];
    }
  }

  // ---- Eventbrite --------------------------------------------------
  private async fetchFromEventbrite(
    filters?: EventFilters,
  ): Promise<StandardizedEvent[]> {
    try {
      return await this.eventbriteService.fetchBerlinEvents(filters?.area);
    } catch (err: unknown) {
      console.error("Eventbrite fetch failed:", err);
      return [];
    }
  }

  // ---- Local JSON --------------------------------------------------
  private async fetchFromLocalJSON(
    filters?: EventFilters,
  ): Promise<StandardizedEvent[]> {
    try {
      const res = await fetch("/events.json");
      const raw: LocalJsonEvent[] = await res.json();

      let events: StandardizedEvent[] = raw.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description ?? null,
        event_date: e.event_date,
        location: e.location ?? null,
        image_url: e.image_url ?? null,
        category: e.category ?? null,
        tags: e.tags ?? [],
        source_url: e.source_url ?? null,
        source: "local" as const,
      }));

      // minimal filter usage so `filters` isn’t “unused”
      if (filters?.date) events = events.filter((ev) => ev.event_date === filters.date);
      if (filters?.area)
        events = events.filter((ev) =>
          ev.location?.toLowerCase().includes(filters.area!.toLowerCase()),
        );

      return events;
    } catch (err: unknown) {
      console.error("Local JSON fetch failed:", err);
      return [];
    }
  }

  // ---- In-memory filters ------------------------------------------
  private applyFilters(
    list: StandardizedEvent[],
    f?: EventFilters,
  ): StandardizedEvent[] {
    if (!f) return list;

    return list.filter((ev) => {
      if (f.date && ev.event_date !== f.date) return false;
      if (f.category && ev.category !== f.category) return false;

      if (f.tags?.length) {
        const ok = f.tags.some((tag) =>
          [ev.category, ...ev.tags]
            .filter(Boolean)
            .some((t) => t!.toLowerCase().includes(tag.toLowerCase())),
        );
        if (!ok) return false;
      }

      if (f.search) {
        const s = f.search.toLowerCase();
        if (
          !ev.title.toLowerCase().includes(s) &&
          !ev.description?.toLowerCase().includes(s) &&
          !ev.location?.toLowerCase().includes(s)
        )
          return false;
      }
      return true;
    });
  }

  // ---- Convenience helpers ----------------------------------------
  getBerlinAreas() {
    return BERLIN_AREAS;
  }

  async getEventsByDate(date: string, area?: string) {
    return this.fetchAllEvents({ date, area });
  }

  async getEventsByDateRange(start: string, end: string, area?: string) {
    const all = await this.fetchAllEvents({ area });
    return all.filter((e) => e.event_date >= start && e.event_date <= end);
  }
}
