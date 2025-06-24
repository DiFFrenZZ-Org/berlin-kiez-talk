import { StandardizedEvent } from "@/types/events";
import { inferCategory, generateEventTags } from "@/utils/eventUtils";
import { errorLogger } from "@/utils/errorLogger";

/* ------------------------------------------------------------------ */
/*  Google-events JSON fragment returned by the proxy                 */
/* ------------------------------------------------------------------ */
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
  /** Backend proxy endpoint – no API key on the client anymore */
  private readonly baseUrl = "/api/serp/events";

  /**
   * Fetch events for a city (default “Berlin”).
   * The server converts `city`→`q=Events in <city>` and adds the real SerpAPI key.
   */
  async fetchEvents(city = "Berlin"): Promise<StandardizedEvent[]> {
    const params = new URLSearchParams({ city });

    try {
      const res = await fetch(`${this.baseUrl}?${params}`);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Proxy HTTP ${res.status} ${body}`);
      }

      const json = await res.json();
      const events = (json.events_results ?? []) as SerpApiEvent[];
      return events.map((e) => this.standardize(e));
    } catch (err) {
      errorLogger.logAPIError("fetchFromSerpAPI", err, { city });
      return [];
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Normaliser → StandardizedEvent                                    */
  /* ------------------------------------------------------------------ */
  private standardize(e: SerpApiEvent): StandardizedEvent {
    const start = e.date?.start_date?.split("–")[0]?.trim();
    const yearMatch = e.description?.match(/(20\d{2})/);
    const year = yearMatch ? yearMatch[1] : String(new Date().getFullYear());
    const iso = start
      ? new Date(`${start} ${year}`).toISOString()
      : new Date().toISOString();

    const location = Array.isArray(e.address)
      ? e.address.join(", ")
      : e.address ?? "";

    const category = inferCategory(e.title, e.description);

    return {
      id: `serpapi-${e.title}-${iso}`,
      title: e.title,
      description: e.description ?? "",
      event_date: iso,
      location: location || null,
      image_url: e.image ?? e.thumbnail ?? null,
      category,
      tags: generateEventTags({
        title: e.title,
        description: e.description ?? "",
        tags: [],
        category,
      }),
      source_url: e.link ?? null,
      source: "serpapi",
    };
  }
}
