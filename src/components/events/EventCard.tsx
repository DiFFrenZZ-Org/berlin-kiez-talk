
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, MapPin } from "lucide-react";
import { StandardizedEvent } from '@/types/events';
import { getRelativeDateLabel } from '@/utils/dateUtils';

interface EventCardProps {
  event: StandardizedEvent;
  isSelected: boolean;
  onClick: () => void;
}

export const EventCard = ({ event, isSelected, onClick }: EventCardProps) => {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-blue-600/30 border-blue-400 shadow-lg' 
          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-white text-sm line-clamp-2">
            {event.title}
          </h3>
          
          <div className="flex items-center space-x-2 text-xs text-blue-300">
            <CalendarIcon className="h-3 w-3" />
            <span>{getRelativeDateLabel(event.event_date)}</span>
          </div>
          
          {event.location && (
            <div className="flex items-center space-x-2 text-xs text-blue-300">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          
          {event.category && (
            <Badge variant="outline" className="text-xs bg-blue-600/20 border-blue-400/30">
              {event.category}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
