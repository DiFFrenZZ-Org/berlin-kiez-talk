export interface NewsArticle {
  id: string;
  title: string;
  description: string | null;
  published_at: string;
  url: string;
  image_url: string | null;
  source: string;
  author: string | null;
  content: string | null;
}
