import { StandardizedEvent } from "@/types/events";

/* ------------------------------------------------------------------ */
/*  1. Duplicate removal                                              */
/* ------------------------------------------------------------------ */

export function removeDuplicateEvents(
  events: StandardizedEvent[]
): StandardizedEvent[] {
  const seen = new Set<string>();
  return events.filter((ev) => {
    const key = `${ev.title}-${ev.event_date}-${ev.location}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ------------------------------------------------------------------ */
/*  2. Category inference                                             */
/* ------------------------------------------------------------------ */

export function inferCategory(
  title: string,
  description?: string | null
): string {
  const txt = `${title} ${description ?? ""}`.toLowerCase();

  if (/techno|club|dj/.test(txt)) return "techno";
  if (/art|gallery|exhibition/.test(txt)) return "culture";
  if (/food|restaurant|market/.test(txt)) return "food";
  if (/festival|open-air|outdoor/.test(txt)) return "open-air";
  if (/workshop|learn|course/.test(txt)) return "workshop";
  if (/sport|fitness|run/.test(txt)) return "sports";
  return "other";
}

/* ------------------------------------------------------------------ */
/*  3. Tag generator (no more `any`)                                  */
/* ------------------------------------------------------------------ */

type TaggableEvent = Pick<
  StandardizedEvent,
  "title" | "description" | "tags" | "category"
>;

export function generateEventTags(ev: TaggableEvent): string[] {
  const tags: string[] = [];

  if (Array.isArray(ev.tags)) tags.push(...ev.tags);
  if (ev.category) tags.push(ev.category);

  const txt = `${ev.title} ${ev.description ?? ""}`.toLowerCase();

  if (txt.includes("free")) tags.push("Free");
  if (/(outdoor|open-air)/.test(txt)) tags.push("Outdoor");
  if (txt.includes("indoor")) tags.push("Indoor");
  if (/(family|kids|children)/.test(txt)) tags.push("Family-friendly");
  if (txt.includes("music")) tags.push("Music");
  if (/(food|drink)/.test(txt)) tags.push("Food & Drink");
  if (/(art|culture)/.test(txt)) tags.push("Culture");
  if (/(workshop|learn)/.test(txt)) tags.push("Educational");

  return Array.from(new Set(tags)); // de-duplicate
}

