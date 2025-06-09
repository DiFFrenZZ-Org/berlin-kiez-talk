
import { useState, useEffect } from "react";
import { Megaphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string | null;
  profile?: {
    nickname: string | null;
  } | null;
}

export const AnnouncementsFeed = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Since announcements table doesn't exist yet, show placeholder data
    setLoading(false);
    // Future implementation will fetch from supabase when table is created
  }, []);

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "vor wenigen Minuten";
    if (diffInHours < 24) return `vor ${diffInHours}h`;
    return `vor ${Math.floor(diffInHours / 24)}d`;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Megaphone className="h-5 w-5 mr-2" /> Ankündigungen
            </CardTitle>
            <CardDescription className="text-blue-200">
              Wichtige Infos aus der Community
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center text-blue-300 py-8">Lädt...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center text-blue-300 py-8">
              <p>Keine Ankündigungen verfügbar</p>
              <p className="text-sm mt-2 opacity-70">Diese Funktion wird bald verfügbar sein</p>
            </div>
          ) : (
            announcements.map((ann) => (
              <Card key={ann.id} className="bg-white/5 text-white">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-blue-300">
                    <span>{ann.profile?.nickname || "System"}</span>
                    <span>{formatTimeAgo(ann.created_at)}</span>
                  </div>
                  <h3 className="font-semibold text-lg">{ann.title}</h3>
                  <p className="text-sm text-blue-200 whitespace-pre-wrap">{ann.content}</p>
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
