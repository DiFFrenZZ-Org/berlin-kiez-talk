import { useState, useEffect } from "react";
import { Megaphone } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  created_at: string | null;
  borough: string | null;
  category: string | null;
}

export const AnnouncementsFeed = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      const { data, error } = await supabase
        .from("berlin_news")
        .select("id, title, content, created_at, borough, category")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Could not load news:", error);
      } else {
        setNews(data);
      }
      setLoading(false);
    };

    fetchNews();
  }, []);

  const formatTimeAgo = (iso: string | null) => {
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
                  <div className="flex items-center justify-between text-xs text-contrast-low">
                    <span>System</span>
                    <span>{formatTimeAgo(item.created_at)}</span>
                  </div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-contrast-low whitespace-pre-wrap">
                    {item.content}
                  </p>
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
