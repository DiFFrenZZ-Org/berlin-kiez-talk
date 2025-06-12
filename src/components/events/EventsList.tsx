
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventCard } from './EventCard';
import { StandardizedEvent } from '@/types/events';
import { getRelativeDateLabel } from '@/utils/dateUtils';

interface EventsListProps {
  events: StandardizedEvent[];
  selectedEvent: StandardizedEvent | null;
  onEventSelect: (event: StandardizedEvent) => void;
  selectedDate?: Date;
  loading: boolean;
}

export const EventsList = ({ 
  events, 
  selectedEvent, 
  onEventSelect, 
  selectedDate, 
  loading 
}: EventsListProps) => {
  const getHeaderTitle = () => {
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      return `Events (${events.length}) - ${getRelativeDateLabel(dateStr)}`;
    }
    return `Events (${events.length})`;
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
      <CardHeader>
        <CardTitle className="text-lg">
          {getHeaderTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center text-blue-300 py-8">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center text-blue-300 py-8">
            <p>No events found</p>
            <p className="text-sm mt-2 opacity-70">
              {selectedDate 
                ? "No events scheduled for this date" 
                : "Try adjusting your filters or selecting a different date"
              }
            </p>
          </div>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isSelected={selectedEvent?.id === event.id}
              onClick={() => onEventSelect(event)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};
