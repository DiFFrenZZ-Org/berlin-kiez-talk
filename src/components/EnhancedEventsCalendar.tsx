
import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, MapPin, Filter, X, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EventsService } from "@/services/eventsService";
import { StandardizedEvent } from "@/services/eventbrite";

const BERLIN_EVENT_TAGS = [
  "Techno", "Open-Air", "Festival", "Club", "Concert", "Art", "Theater", 
  "Food", "Market", "Kultur", "Dance", "Electronic", "Rock", "Jazz",
  "Comedy", "Exhibition", "Workshop", "Sports", "Family"
];

export const EnhancedEventsCalendar = () => {
  const [events, setEvents] = useState<StandardizedEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<StandardizedEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<StandardizedEvent | null>(null);
  const [eventbriteApiKey, setEventbriteApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const eventsService = new EventsService(eventbriteApiKey);

  useEffect(() => {
    loadEvents();
  }, [eventbriteApiKey]);

  useEffect(() => {
    filterEvents();
  }, [events, selectedTags, searchTerm, selectedDate]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const filters = {
        date: selectedDate?.toISOString().split('T')[0],
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        search: searchTerm || undefined
      };
      
      const allEvents = await eventsService.fetchAllEvents(filters);
      setEvents(allEvents);
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Filter by selected date
    if (selectedDate) {
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      filtered = filtered.filter(event => 
        event.event_date && event.event_date.startsWith(selectedDateStr)
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(event =>
        selectedTags.some(tag =>
          event.tags?.includes(tag) ||
          event.title.toLowerCase().includes(tag.toLowerCase()) ||
          event.description?.toLowerCase().includes(tag.toLowerCase()) ||
          event.category?.toLowerCase().includes(tag.toLowerCase())
        )
      );
    }

    setFilteredEvents(filtered);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric" 
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar and Filters */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader>
            <CardTitle className="text-xl flex items-center justify-between">
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Events Calendar
              </div>
              <Button
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                variant="ghost"
                size="sm"
                className="text-blue-300 hover:text-white"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription className="text-blue-200">
              Kommende Events in Berlin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showApiKeyInput && (
              <div className="space-y-2">
                <label className="text-sm text-blue-300">Eventbrite API Key:</label>
                <Input
                  type="password"
                  placeholder="Enter your Eventbrite API key"
                  value={eventbriteApiKey}
                  onChange={(e) => setEventbriteApiKey(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-blue-300"
                />
                <p className="text-xs text-blue-400">
                  Get your API key from{" "}
                  <a 
                    href="https://www.eventbrite.com/platform/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-300"
                  >
                    Eventbrite API Keys
                  </a>
                </p>
              </div>
            )}
            
            <Calendar 
              selected={selectedDate} 
              onSelect={setSelectedDate}
              className="bg-white/5 rounded-md p-2"
            />
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filter Events</span>
              </div>
              
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-blue-300"
              />
              
              <div className="space-y-2">
                <span className="text-xs text-blue-300">Popular Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {BERLIN_EVENT_TAGS.slice(0, 8).map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className={`cursor-pointer text-xs ${
                        selectedTags.includes(tag)
                          ? "bg-blue-600 text-white"
                          : "bg-white/10 text-blue-300 border-white/20 hover:bg-white/20"
                      }`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedTags.length > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-blue-300">Active filters:</span>
                  {selectedTags.map(tag => (
                    <Badge
                      key={tag}
                      className="bg-blue-600 text-white cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader>
            <CardTitle className="text-lg">
              Events ({filteredEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center text-blue-300 py-8">Lädt...</div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center text-blue-300 py-8">
                <p>Keine Events gefunden</p>
                <p className="text-sm mt-2 opacity-70">
                  Versuche andere Filter oder füge eine Eventbrite API Key hinzu
                </p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <Card 
                  key={event.id} 
                  className={`bg-white/5 text-white cursor-pointer transition-all ${
                    selectedEvent?.id === event.id ? 'ring-2 ring-blue-400' : 'hover:bg-white/10'
                  }`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <CardContent className="p-3 space-y-2">
                    <h3 className="font-semibold text-sm line-clamp-2">{event.title}</h3>
                    <div className="flex items-center justify-between text-xs text-blue-300">
                      <span>{formatDate(event.event_date)}</span>
                      {event.location && (
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-20">{event.location}</span>
                        </span>
                      )}
                    </div>
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {event.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} className="text-xs bg-blue-600/50">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-blue-400">
                      Source: {event.source}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Details with Image */}
      <div className="lg:col-span-1">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEvent ? (
              <div className="space-y-4">
                {selectedEvent.image_url && (
                  <div className="w-full h-48 bg-white/5 rounded-lg overflow-hidden">
                    <img
                      src={selectedEvent.image_url}
                      alt={selectedEvent.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg mb-2">{selectedEvent.title}</h3>
                  <p className="text-sm text-blue-200 mb-3 whitespace-pre-wrap">
                    {selectedEvent.description || 'Keine Beschreibung verfügbar'}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-blue-300" />
                      <span>{formatDate(selectedEvent.event_date)}</span>
                    </div>
                    {selectedEvent.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-blue-300" />
                        <span>{selectedEvent.location}</span>
                      </div>
                    )}
                  </div>
                  {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                    <div className="mt-3">
                      <span className="text-xs text-blue-300 block mb-2">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedEvent.tags.map(tag => (
                          <Badge key={tag} className="text-xs bg-blue-600/50">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedEvent.source_url && (
                    <Button
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                      onClick={() => window.open(selectedEvent.source_url, '_blank')}
                    >
                      Mehr Infos
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-blue-300 py-8">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Wähle ein Event aus der Liste</p>
                <p className="text-sm mt-1 opacity-70">um Details und Bilder zu sehen</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
