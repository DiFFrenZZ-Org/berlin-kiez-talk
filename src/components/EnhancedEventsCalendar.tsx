
import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { EventFilters } from './events/EventFilters';
import { EventsList } from './events/EventsList';
import { EventDetails } from './events/EventDetails';
import { UpcomingEvents } from './events/UpcomingEvents';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from "@/hooks/useAuth";

export const EnhancedEventsCalendar = () => {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState<string>("all_areas");

  const {
    events,
    filteredEvents,
    loading,
    selectedEvent,
    setSelectedEvent,
    loadEvents,
    filterEvents,
    getEventCountForDate
  } = useEvents();

  useEffect(() => {
    // Set default area from user profile
    if (profile?.borough && selectedArea === "all_areas") {
      setSelectedArea(profile.borough);
    }
  }, [profile]);

  useEffect(() => {
    const areaFilter = selectedArea === "all_areas" ? undefined : selectedArea;
    loadEvents({
      date: selectedDate?.toISOString().split('T')[0],
      area: areaFilter
    });
  }, [selectedArea, selectedDate]);

  useEffect(() => {
    filterEvents({ searchTerm, selectedTags });
  }, [events, selectedTags, searchTerm]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSearchTerm("");
    setSelectedTags([]);
  };

  const displayArea = selectedArea === "all_areas" ? "All Berlin areas" : selectedArea;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Calendar and Filters */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Events Calendar
            </CardTitle>
            <CardDescription className="text-blue-200">
              Events in {displayArea}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <EventFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              selectedArea={selectedArea}
              setSelectedArea={setSelectedArea}
              availableAreas={['Mitte', 'Kreuzberg', 'Friedrichshain', 'Prenzlauer Berg', 'Neukölln', 'Charlottenburg', 'Schöneberg', 'Wedding', 'Tempelhof', 'Steglitz']}
            />
            
            <Calendar 
              selected={selectedDate} 
              onSelect={handleDateSelect}
              className="bg-white/5 rounded-md p-2"
              modifiers={{
                hasEvents: (date) => getEventCountForDate(date) > 0
              }}
              modifiersStyles={{
                hasEvents: { 
                  backgroundColor: 'rgba(59, 130, 246, 0.3)',
                  fontWeight: 'bold',
                  border: '1px solid rgba(59, 130, 246, 0.5)'
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Upcoming Events Section */}
        <UpcomingEvents
          events={events}
          selectedEvent={selectedEvent}
          onEventSelect={setSelectedEvent}
          loading={loading}
        />
      </div>

      {/* Events List */}
      <div className="lg:col-span-1 space-y-4">
        <EventsList
          events={filteredEvents}
          selectedEvent={selectedEvent}
          onEventSelect={setSelectedEvent}
          selectedDate={selectedDate}
          loading={loading}
        />
      </div>

      {/* Event Details */}
      <div className="lg:col-span-2">
        <EventDetails selectedEvent={selectedEvent} />
      </div>
    </div>
  );
};
