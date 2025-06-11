
import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StandardizedEvent } from '@/types/events';
import { formatEventDate } from '@/utils/eventUtils';

interface EventCardProps {
  event: StandardizedEvent;
  isSelected: boolean;
  onClick: () => void;
}

export const EventCard = ({ event, isSelected, onClick }: EventCardProps) => {
  return (
    <Card 
      className={`bg-white/5 text-white cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-400 bg-white/15' : 'hover:bg-white/10'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-2">{event.title}</h3>
        <div className="flex items-center justify-between text-xs text-blue-300">
          <span>{formatEventDate(event.event_date)}</span>
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
  );
};
