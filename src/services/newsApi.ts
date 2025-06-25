/* ------------------------------------------------------------------ */
/*  NewsApiService – wraps the /api/news proxy and normalises output  */
/* ------------------------------------------------------------------ */
import { NewsArticle } from '@/types/news';
import { errorLogger } from '@/utils/errorLogger';

/** Exact shape returned by NewsAPI itself (internal use only) */
interface NewsArticleRaw {
  source: { id?: string; name: string };
  author?: string;
  title: string;
  description?: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  content?: string;
}

export class NewsApiService {
  private readonly baseUrl = '/api/news';

  /**
   * Generic caller – pass any NewsAPI query-string params.
   * Always resolves to your app-level `NewsArticle` model.
   */
  async fetchNews(params: Record<string, string> = {}): Promise<NewsArticle[]> {
    const qs = new URLSearchParams(params).toString();

    try {
      const res = await fetch(`${this.baseUrl}?${qs}`);

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Proxy HTTP ${res.status} ${body}`);
      }

      const json = await res.json();
      const raw: NewsArticleRaw[] = json.articles ?? [];

      return raw.map((a, i) => ({
        id:            `newsapi-${i}-${a.url}`,
        title:         a.title,
        description:   a.description ?? null,
        published_at:  a.publishedAt,
        url:           a.url,
        image_url:     a.urlToImage ?? null,
        source:        a.source?.name ?? 'NewsAPI',
        author:        a.author ?? null,
        content:       a.content ?? null
      }));
    } catch (err) {
      /* 🔴  centralised error capture */
      errorLogger.logAPIError('NewsApiService.fetchNews', err, params);
      return [];                        // degrade gracefully
    }
  }

  /**
   * Convenience wrapper for “Berlin AND culture” news in DE/EN.
   * Kept for back-compat; remove when no longer used.
   */
  fetchBerlinNews(fromISO: string, toISO: string) {
    return this.fetchNews({
      q: '"Berlin" AND culture',
      from: fromISO,
      to:   toISO,
      language: 'en',
      sortBy: 'publishedAt',
    });
  }
}
