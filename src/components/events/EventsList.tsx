
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventCard } from './EventCard';
import { StandardizedEvent } from '@/types/events';
import { formatEventDate } from '@/utils/eventUtils';

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
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
      <CardHeader>
        <CardTitle className="text-lg">
          Events ({events.length})
          {selectedDate && (
            <span className="text-sm font-normal text-blue-300 block">
              {formatEventDate(selectedDate.toISOString().split('T')[0])}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center text-blue-300 py-8">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center text-blue-300 py-8">
            <p>No events found</p>
            <p className="text-sm mt-2 opacity-70">
              Try adjusting your filters or selecting a different date
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
