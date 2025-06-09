import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";

interface EventItem {
  id: string;
  title: string;
  description: string;
  event_date: string | null;
  location: string | null;
}

export const EventsCalendar = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);

  const fetchEvents = async () => {
    setLoading(true);
    let query = supabase.from("events").select("*").order("event_date");
    if (selectedDate) {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
      query = query.gte("event_date", start.toISOString()).lte("event_date", end.toISOString());
    }
    const { data, error } = await query;
    if (!error) {
      setEvents(data || []);
    } else {
      console.error("Error loading events", error);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" /> Veranstaltungen
          </CardTitle>
          <CardDescription className="text-blue-200">Kommende Termine in deinem Kiez</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Calendar selected={selectedDate} onSelect={setSelectedDate} />
          {loading ? (
            <div className="text-center text-blue-300 py-8">Lädt...</div>
          ) : events.length === 0 ? (
            <div className="text-center text-blue-300 py-8">Keine Events gefunden</div>
          ) : (
            events.map((ev) => (
              <Card key={ev.id} className="bg-white/5 text-white">
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-lg">{ev.title}</h3>
                  <p className="text-sm text-blue-200 whitespace-pre-wrap">{ev.description}</p>
                  <div className="flex items-center justify-between text-xs text-blue-300">
                    <span>{formatDate(ev.event_date)}</span>
                    {ev.location && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{ev.location}</span>
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EventsCalendar;
