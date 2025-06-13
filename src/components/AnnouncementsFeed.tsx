import { useState, useEffect } from "react";
import { Megaphone } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string | null;
  profile?: { nickname: string | null } | null;
}

export const AnnouncementsFeed = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  /* ------------------------------------------------------------------ */
  /*  Placeholder data  Supabase table                     */
  /* ------------------------------------------------------------------ */
 useEffect(() => {
  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, content, created_at, profiles(nickname)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load announcements:", error);
    } else {
      setAnnouncements(
        data.map((row) => ({
          id: row.id,
          title: row.title,
          content: row.content,
          created_at: row.created_at,
          profile: { nickname: row.profiles?.nickname ?? "System" },
        }))
      );
    }
    setLoading(false);
  };

  fetchAnnouncements();
}, []);


  /* ------------------------------------------------------------------ */
  /*  Helpers                                                           */
  /* ------------------------------------------------------------------ */
  const formatTimeAgo = (iso: string | null) => {
    if (!iso) return "";
    const diffH = Math.floor((Date.now() - +new Date(iso)) / 36e5);
    if (diffH < 1) return "vor wenigen Minuten";
    if (diffH < 24) return `vor ${diffH}h`;
    return `vor ${Math.floor(diffH / 24)}d`;
  };

  /* ------------------------------------------------------------------ */
  /*  JSX                                                               */
  /* ------------------------------------------------------------------ */
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
          ) : announcements.length === 0 ? (
            <div className="text-center text-contrast-low py-8">
              <p>Keine Ankündigungen verfügbar</p>
              <p className="text-sm mt-2 opacity-70">
                Diese Funktion wird bald verfügbar sein
              </p>
            </div>
          ) : (
            announcements.map((ann) => (
              <Card key={ann.id} className="bg-white/5 text-white">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-contrast-low">
                    <span>{ann.profile?.nickname ?? "System"}</span>
                    <span>{formatTimeAgo(ann.created_at)}</span>
                  </div>
                  <h3 className="font-semibold text-lg">{ann.title}</h3>
                  <p className="text-sm text-contrast-low whitespace-pre-wrap">
                    {ann.content}
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
