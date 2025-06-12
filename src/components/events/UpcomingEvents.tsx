
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventCard } from './EventCard';
import { StandardizedEvent } from '@/types/events';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

interface UpcomingEventsProps {
  events: StandardizedEvent[];
  selectedEvent: StandardizedEvent | null;
  onEventSelect: (event: StandardizedEvent) => void;
  loading: boolean;
}

export const UpcomingEvents = ({ 
  events = [], 
  selectedEvent, 
  onEventSelect, 
  loading 
}: UpcomingEventsProps) => {
  // Get events for the next 7 days
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const upcomingEvents = events.filter(event => {
    if (!event.event_date) return false;
    const eventDate = new Date(event.event_date);
    return eventDate >= today && eventDate <= nextWeek;
  }).slice(0, 5); // Show max 5 upcoming events

  const getTimeLabel = (eventDate: string) => {
    const event = new Date(eventDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (event.toDateString() === today.toDateString()) {
      return "Today";
    } else if (event.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      const diffTime = event.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `In ${diffDays} days`;
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center text-blue-300 py-8">Loading upcoming events...</div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center text-blue-300 py-8">
            <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No upcoming events</p>
            <p className="text-sm mt-2 opacity-70">
              Check back later for new events
            </p>
          </div>
        ) : (
          upcomingEvents.map((event) => (
            <div key={event.id} className="relative">
              <div className="absolute -left-2 top-2 text-xs text-blue-300 bg-blue-600/30 px-2 py-1 rounded">
                {getTimeLabel(event.event_date)}
              </div>
              <div className="ml-16">
                <EventCard
                  event={event}
                  isSelected={selectedEvent?.id === event.id}
                  onClick={() => onEventSelect(event)}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
