/* ------------------------------------------------------------------ */
/*  src/services/eventsService.ts                                     */
/* ------------------------------------------------------------------ */
import { EventbriteService } from './eventbrite';
import { SerpApiService } from './serpapi';
import { StandardizedEvent, EventFilters } from '@/types/events';
import { removeDuplicateEvents } from '@/utils/eventUtils';
import { supabase } from '@/integrations/supabase/client';
import { BERLIN_AREAS } from '@/constants/berlin';
import { errorLogger } from '@/utils/errorLogger';

/* Local JSON entry -------------------------------------------------- */
interface LocalJsonEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string; // ISO-8601
  location?: string;
  image_url?: string;
  category?: string;
  tags?: string[];
  source_url?: string;
}

/* Helper for Promise.allSettled-discrimination ---------------------- */
function isFulfilled<T>(
  r: PromiseSettledResult<T>
): r is PromiseFulfilledResult<T> {
  return r.status === 'fulfilled';
}

export class EventsService {
  private eventbriteService = new EventbriteService();
  private serpApiService = new SerpApiService();

  /* ---------------- PUBLIC ----------------------------------------- */
  async fetchAllEvents(filters?: EventFilters): Promise<StandardizedEvent[]> {
    const results = await Promise.allSettled([
      this.fetchFromSupabase(filters),
      this.fetchFromEventbrite(filters),
      this.fetchFromSerpAPI(filters),
      this.fetchFromLocalJSON(filters),
    ]);

    /* Collect successes, log rejections ----------------------------- */
    const collected: StandardizedEvent[] = [];
    ['Supabase', 'Eventbrite', 'SerpAPI', 'LocalJSON'].forEach((src, i) => {
      const r = results[i];
      if (isFulfilled(r)) collected.push(...r.value);
      else errorLogger.logAPIError(`fetch_${src.toLowerCase()}`, r.reason);
    });

    const deduped = removeDuplicateEvents(collected);
    return this.applyFilters(deduped, filters);
  }

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

  /* ---------------- PRIVATE fetchers ------------------------------- */
  private async fetchFromSupabase(
    filters?: EventFilters
  ): Promise<StandardizedEvent[]> {
    try {
      let q = supabase.from('berlin_events').select('*').order('event_date');

      if (filters?.date) q = q.eq('event_date', filters.date);

      const { data, error } = await q;
      if (error) throw error;

      return (data ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description ?? '',
        event_date: e.event_date,
        location: e.location ?? '',
        image_url: e.image_url ?? '',
        category: e.category ?? '',
        tags: e.tags ?? [],
        source_url: e.source_url ?? '',
        source: 'database' as const,
      }));
    } catch (err) {
      errorLogger.logSupabaseError('fetchFromSupabase', err, 'berlin_events');
      return [];
    }
  }

  private async fetchFromEventbrite(
    filters?: EventFilters
  ): Promise<StandardizedEvent[]> {
    try {
      return await this.eventbriteService.fetchBerlinEvents(filters?.area);
    } catch (err) {
      errorLogger.logAPIError('fetchFromEventbrite', err, {
        area: filters?.area,
      });
      return [];
    }
  }

  private async fetchFromSerpAPI(
    filters?: EventFilters
  ): Promise<StandardizedEvent[]> {
    try {
      const city = filters?.area ?? 'Berlin';
      const query = filters?.search
        ? `${filters.search} in ${city}`
        : `Events in ${city}`;
      return await this.serpApiService.fetchEvents(query);
    } catch (err) {
      errorLogger.logAPIError('fetchFromSerpAPI', err, {
        search: filters?.search,
        area: filters?.area,
      });
      return [];
    }
  }

  private async fetchFromLocalJSON(
    filters?: EventFilters
  ): Promise<StandardizedEvent[]> {
    try {
      const res = await fetch('/data/events.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let events = (await res.json()) as LocalJsonEvent[];

      /* minimal filter on the JSON itself --------------------------- */
      if (filters?.area) {
        const a = filters.area.toLowerCase();
        events = events.filter((e) => e.location?.toLowerCase().includes(a));
      }
      if (filters?.date) {
        events = events.filter((e) => e.event_date === filters.date);
      }

      return events.map((e) => ({
        id: `local-${e.id}`,
        title: e.title,
        description: e.description ?? '',
        event_date: e.event_date,
        location: e.location ?? '',
        image_url: e.image_url ?? '',
        category: e.category ?? '',
        tags: e.tags ?? [],
        source_url: e.source_url ?? '',
        source: 'local' as const,
      }));
    } catch (err) {
      errorLogger.logAPIError('fetchFromLocalJSON', err);
      return [];
    }
  }

  /* ---------------- In-memory filter -------------------------------- */
  private applyFilters(
    list: StandardizedEvent[],
    f?: EventFilters
  ): StandardizedEvent[] {
    if (!f) return list;

    return list.filter((e) => {
      if (f.date && e.event_date !== f.date) return false;
      if (f.category && e.category !== f.category) return false;

      if (f.tags?.length) {
        const ok = f.tags.some((t) => {
          const tLow = t.toLowerCase();
          return (
            e.tags.includes(t) ||
            e.title.toLowerCase().includes(tLow) ||
            e.description.toLowerCase().includes(tLow) ||
            e.category.toLowerCase().includes(tLow)
          );
        });
        if (!ok) return false;
      }

      if (f.search) {
        const s = f.search.toLowerCase();
        const hit =
          e.title.toLowerCase().includes(s) ||
          e.description.toLowerCase().includes(s) ||
          e.location.toLowerCase().includes(s);
        if (!hit) return false;
      }
      return true;
    });
  }
}
