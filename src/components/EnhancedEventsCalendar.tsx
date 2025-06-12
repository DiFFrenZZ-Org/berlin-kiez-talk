
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventsList } from "@/components/events/EventsList";
import { UpcomingEvents } from "@/components/events/UpcomingEvents";
import { useEvents } from "@/hooks/useEvents";
import { StandardizedEvent } from '@/types/events';
import { Calendar as CalendarIcon, MapPin } from "lucide-react";

export const EnhancedEventsCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { events, loading, selectedEvent, setSelectedEvent } = useEvents();
  
  // Get events for the selected date
  const getEventsForDate = (date: Date | undefined): StandardizedEvent[] => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      if (!event.event_date) return false;
      const eventDateStr = new Date(event.event_date).toISOString().split('T')[0];
      return eventDateStr === dateStr;
    });
  };

  // Get dates that have events for calendar highlighting
  const getDatesWithEvents = (): Date[] => {
    return events
      .filter(event => event.event_date)
      .map(event => new Date(event.event_date!))
      .filter((date, index, self) => 
        index === self.findIndex(d => d.toDateString() === date.toDateString())
      );
  };

  const eventsForSelectedDate = getEventsForDate(selectedDate);
  const datesWithEvents = getDatesWithEvents();

  return (
    <div className="space-y-6">
      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Calendar - 4 columns */}
        <Card className="lg:col-span-4 bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <CalendarIcon className="h-5 w-5" />
              <span>Events Calendar</span>
            </CardTitle>
            <CardDescription className="text-blue-200">
              Select a date to view events
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border-0 w-full"
              classNames={{
                months: "flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 flex-1",
                month: "space-y-4 w-full flex flex-col",
                table: "w-full h-full border-collapse space-y-1",
                head_row: "",
                head_cell: "text-blue-300 rounded-md w-8 font-normal text-[0.8rem] text-center",
                row: "w-full mt-2",
                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-blue-600/20 [&:has([aria-selected].day-outside)]:bg-blue-600/10 [&:has([aria-selected].day-range-end)]:rounded-r-md",
                day: "h-8 w-8 p-0 font-normal text-white hover:bg-blue-600/20 rounded-md transition-colors",
                day_range_end: "day-range-end",
                day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
                day_today: "bg-blue-500/30 text-blue-200 font-semibold",
                day_outside: "text-blue-400/50 opacity-50 aria-selected:bg-blue-600/50 aria-selected:text-blue-300 aria-selected:opacity-30",
                day_disabled: "text-blue-400/30 opacity-50",
                day_range_middle: "aria-selected:bg-blue-600/20 aria-selected:text-white",
                day_hidden: "invisible",
              }}
              modifiers={{
                hasEvents: datesWithEvents,
              }}
              modifiersClassNames={{
                hasEvents: "bg-green-500/30 border border-green-400/50 font-semibold",
              }}
            />
            
            {/* Legend */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span>Selected date</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500/30 border border-green-400/50 rounded"></div>
                <span>Has events</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500/30 rounded"></div>
                <span>Today</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Events - 4 columns */}
        <Card className="lg:col-span-4 bg-white/10 backdrop-blur-md border-white/20 text-white overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {selectedDate ? (
                <>Events for {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</>
              ) : (
                'Select a Date'
              )}
            </CardTitle>
            <CardDescription className="text-blue-200">
              {eventsForSelectedDate.length} event{eventsForSelectedDate.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-full overflow-y-auto">
            {eventsForSelectedDate.length > 0 ? (
              <div className="p-4 space-y-4">
                {eventsForSelectedDate.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <h4 className="font-semibold text-white mb-2 line-clamp-2">
                      {event.title}
                    </h4>
                    
                    {event.location && (
                      <div className="flex items-center space-x-2 text-sm text-blue-300 mb-2">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    
                    {event.description && (
                      <p className="text-sm text-gray-300 line-clamp-3 mb-3">
                        {event.description}
                      </p>
                    )}
                    
                    {event.category && (
                      <Badge variant="outline" className="text-xs bg-blue-600/20 border-blue-400/30">
                        {event.category}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-blue-300">
                <div className="text-center">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No events scheduled for this date</p>
                  <p className="text-sm mt-2 opacity-70">Try selecting another date</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events - 4 columns */}
        <div className="lg:col-span-4 overflow-hidden">
          <UpcomingEvents 
            events={events}
            selectedEvent={selectedEvent}
            onEventSelect={setSelectedEvent}
            loading={loading}
          />
        </div>
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="lg:hidden space-y-6">
        {/* Calendar */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Events Calendar</span>
            </CardTitle>
            <CardDescription className="text-blue-200">
              Select a date to view events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border-0 w-full"
              classNames={{
                months: "flex w-full flex-col space-y-4 flex-1",
                month: "space-y-4 w-full flex flex-col",
                table: "w-full border-collapse space-y-1",
                head_row: "",
                head_cell: "text-blue-300 rounded-md w-8 font-normal text-[0.8rem] text-center",
                row: "w-full mt-2",
                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                day: "h-8 w-8 p-0 font-normal text-white hover:bg-blue-600/20 rounded-md transition-colors",
                day_selected: "bg-blue-600 text-white hover:bg-blue-600",
                day_today: "bg-blue-500/30 text-blue-200 font-semibold",
                day_outside: "text-blue-400/50 opacity-50",
              }}
              modifiers={{
                hasEvents: datesWithEvents,
              }}
              modifiersClassNames={{
                hasEvents: "bg-green-500/30 border border-green-400/50 font-semibold",
              }}
            />
          </CardContent>
        </Card>

        {/* Events for Selected Date */}
        <EventsList 
          events={eventsForSelectedDate}
          selectedEvent={selectedEvent}
          onEventSelect={setSelectedEvent}
          selectedDate={selectedDate}
          loading={loading}
        />

        {/* Upcoming Events */}
        <UpcomingEvents 
          events={events}
          selectedEvent={selectedEvent}
          onEventSelect={setSelectedEvent}
          loading={loading}
        />
      </div>
    </div>
  );
};
