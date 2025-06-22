import { StandardizedEvent } from "@/types/events";
import { inferCategory, generateEventTags } from "@/utils/eventUtils";
import { errorLogger } from "@/utils/errorLogger";

/* Minimal type for Google Events API response */
interface SerpApiEvent {
  title: string;
  date?: { start_date?: string; when?: string };
  address?: string[] | string;
  link?: string;
  description?: string;
  thumbnail?: string;
  image?: string;
}

export class SerpApiService {
  private readonly apiKey = import.meta.env.VITE_SERPAPI_KEY;
  private readonly baseUrl = "https://serpapi.com/search.json";

  async fetchEvents(query = "Events in Berlin"): Promise<StandardizedEvent[]> {
    if (!this.apiKey) {
      console.warn("SerpAPI key missing – skipping fetch");
      return [];
    }

    const params = new URLSearchParams({
      engine: "google_events",
      q: query,
      hl: "en",
      api_key: this.apiKey,
    });

    try {
      const res = await fetch(`${this.baseUrl}?${params}`);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${body}`);
      }

      const json = await res.json();
      const events = (json.events_results ?? []) as SerpApiEvent[];
      return events.map((e) => this.standardize(e));
    } catch (err) {
      errorLogger.logAPIError("fetchFromSerpAPI", err, { query });
      return [];
    }
  }

  private standardize(e: SerpApiEvent): StandardizedEvent {
    const start = e.date?.start_date?.split("–")[0]?.trim();
    const yearMatch = e.description?.match(/(20\d{2})/);
    const year = yearMatch ? yearMatch[1] : String(new Date().getFullYear());
    const iso = start ? new Date(`${start} ${year}`).toISOString() : new Date().toISOString();

    const location = Array.isArray(e.address) ? e.address.join(", ") : e.address ?? "";
    const category = inferCategory(e.title, e.description);

    return {
      id: `serpapi-${e.title}-${iso}`,
      title: e.title,
      description: e.description ?? "",
      event_date: iso,
      location: location || null,
      image_url: e.image ?? e.thumbnail ?? null,
      category,
      tags: generateEventTags({ title: e.title, description: e.description ?? "", tags: [], category }),
      source_url: e.link ?? null,
      source: "serpapi" as const,
    };
  }
}
