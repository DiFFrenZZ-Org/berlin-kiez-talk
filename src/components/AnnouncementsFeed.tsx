import { useState, useEffect } from "react";
import { Megaphone } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NewsApiService } from "@/services/newsApi";
import type { NewsArticle } from "@/types/news";

type NewsItem = NewsArticle;

export const AnnouncementsFeed = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const service = new NewsApiService();
    const now = new Date();
    const to = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const fetchNews = async () => {
      const articles = await service.fetchBerlinNews(now.toISOString(), to.toISOString());
      setNews(articles);
      setLoading(false);
    };

    fetchNews();
  }, []);

  const formatTimeAgo = (iso: string) => {
    if (!iso) return "";
    const diffH = Math.floor((Date.now() - +new Date(iso)) / 36e5);
    if (diffH < 1) return "vor wenigen Minuten";
    if (diffH < 24) return `vor ${diffH}h`;
    return `vor ${Math.floor(diffH / 24)}d`;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Megaphone className="h-5 w-5 mr-2" />
              Ankündigungen
            </CardTitle>
            <CardDescription className="text-contrast-low">
              Wichtige Infos aus der Community
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center text-contrast-low py-8">Lädt …</div>
          ) : news.length === 0 ? (
            <div className="text-center text-contrast-low py-8">
              <p>Keine Ankündigungen verfügbar</p>
              <p className="text-sm mt-2 opacity-70">
                Diese Funktion wird bald verfügbar sein
              </p>
            </div>
          ) : (
            news.map((item) => (
              <Card key={item.id} className="bg-white/5 text-white">
                <CardContent className="p-4 space-y-2">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt=""
                      className="rounded-md w-full h-40 object-cover"
                    />
                  )}
                  <div className="flex items-center justify-between text-xs text-contrast-low">
                    <span>{item.source}</span>
                    <span>{formatTimeAgo(item.published_at)}</span>
                  </div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-contrast-low whitespace-pre-wrap">
                      {item.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnnouncementsFeed;
