import { NewsArticle } from '@/types/news';
import { errorLogger } from '@/utils/errorLogger';

export class NewsApiService {
  private readonly baseUrl = '/api/news';

  async fetchBerlinNews(fromISO: string, toISO: string): Promise<NewsArticle[]> {
    const params = new URLSearchParams({
      from: fromISO,
      to: toISO,
      q: 'Berlin',
      sources: 'bbc-news',
    });

    try {
      const res = await fetch(`${this.baseUrl}?${params}`);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Proxy HTTP ${res.status} ${body}`);
      }
      const json = await res.json();
      const articles = json.articles ?? [];
      return articles.map((a: any, i: number) => ({
        id: `newsapi-${i}-${a.url}`,
        title: a.title,
        description: a.description,
        published_at: a.publishedAt,
        url: a.url,
        image_url: a.urlToImage,
        source: a.source?.name ?? 'NewsAPI',
      }));
    } catch (err) {
      errorLogger.logAPIError('fetchBerlinNews', err, { fromISO, toISO });
      return [];
    }
  }
}
