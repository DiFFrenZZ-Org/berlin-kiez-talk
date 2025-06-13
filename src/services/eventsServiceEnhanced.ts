import { EventbriteService } from "./eventbrite";
import { StandardizedEvent, EventFilters } from "@/types/events";
import { removeDuplicateEvents } from "@/utils/eventUtils";
import { supabase } from "@/integrations/supabase/client";
import { BERLIN_AREAS } from "@/constants/berlin";
import { errorLogger } from "@/utils/errorLogger";

/* ------------------------------------------------------------------ */
/*  Types for local JSON entries                                      */
/* ------------------------------------------------------------------ */
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

export class EventsServiceEnhanced {
  private eventbriteService = new EventbriteService();

  async fetchAllEvents(filters?: EventFilters): Promise<StandardizedEvent[]> {
    const collected: StandardizedEvent[] = [];

    try {
      const results = await Promise.allSettled([
        this.fetchFromSupabase(filters),
        this.fetchFromEventbrite(filters),
        this.fetchFromLocalJSON(filters),          // filters now used
      ]);

      ["Supabase", "Eventbrite", "LocalJSON"].forEach((name, i) => {
        const r = results[i];
        if (r.status === "fulfilled") collected.push(...r.value);
        else errorLogger.logAPIError(`fetch_${name.toLowerCase()}`, r.reason);
      });

      return this.applyFilters(removeDuplicateEvents(collected), filters);
    } catch (err) {
      errorLogger.logError({
        error: err as Error,
        context: "FETCH_ALL_EVENTS",
        additionalData: { filters },
      });
      throw err;
    }
  }

  /* ---------------- Supabase ------------------------------------------ */
  private async fetchFromSupabase(filters?: EventFilters): Promise<StandardizedEvent[]> {
    try {
      let q = supabase.from("berlin_events").select("*").order("event_date");
      if (filters?.date) q = q.eq("event_date", filters.date);

      const { data, error } = await q;
      if (error) throw error;

      return (data || []).map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        event_date: e.event_date,
        location: e.location,
        image_url: e.image_url,
        category: e.category,
        tags: e.tags || [],
        source_url: e.source_url,
        source: "database" as const,
      }));
    } catch (err) {
      errorLogger.logSupabaseError("fetchFromSupabase", err, "berlin_events");
      return [];
    }
  }

  /* ---------------- Eventbrite ---------------------------------------- */
  private async fetchFromEventbrite(filters?: EventFilters): Promise<StandardizedEvent[]> {
    try {
      return await this.eventbriteService.fetchBerlinEvents(filters?.area);
    } catch (err) {
      errorLogger.logAPIError("fetchFromEventbrite", err, { area: filters?.area });
      return [];
    }
  }

  /* ---------------- Local JSON ---------------------------------------- */
  private async fetchFromLocalJSON(filters?: EventFilters): Promise<StandardizedEvent[]> {
    try {
      const res = await fetch("/events.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

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

      /* --- apply minimal filters so `filters` is used here ------------- */
      if (filters?.area) {
        events = events.filter((e) =>
          e.location?.toLowerCase().includes(filters.area!.toLowerCase())
        );
      }
      if (filters?.date) events = events.filter((e) => e.event_date === filters.date);

      return events;
    } catch (err) {
      errorLogger.logAPIError("fetchFromLocalJSON", err);
      return [];
    }
  }

  /* ---------------- In-memory filtering ------------------------------- */
  private applyFilters(list: StandardizedEvent[], f?: EventFilters): StandardizedEvent[] {
    if (!f) return list;

    return list.filter((e) => {
      if (f.date && e.event_date !== f.date) return false;
      if (f.category && e.category !== f.category) return false;

      if (f.tags?.length) {
        const ok = f.tags.some(
          (t) =>
            e.tags.includes(t) ||
            e.title.toLowerCase().includes(t.toLowerCase()) ||
            e.description?.toLowerCase().includes(t.toLowerCase()) ||
            e.category?.toLowerCase().includes(t.toLowerCase())
        );
        if (!ok) return false;
      }

      if (f.search) {
        const s = f.search.toLowerCase();
        const hit =
          e.title.toLowerCase().includes(s) ||
          e.description?.toLowerCase().includes(s) ||
          e.location?.toLowerCase().includes(s);
        if (!hit) return false;
      }
      return true;
    });
  }

  /* ---------------- Convenience helpers ------------------------------- */
  async getEventsByDate(date: string, area?: string) {
    return this.fetchAllEvents({ date, area });
  }

  async getEventsByDateRange(start: string, end: string, area?: string) {
    const all = await this.fetchAllEvents({ area });
    return all.filter((e) => e.event_date >= start && e.event_date <= end);
  }

  getBerlinAreas() {
    return BERLIN_AREAS;
  }
}
