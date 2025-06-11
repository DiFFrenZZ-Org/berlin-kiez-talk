
import { Calendar as CalendarIcon, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StandardizedEvent } from '@/types/events';
import { formatEventDate } from '@/utils/eventUtils';

interface EventDetailsProps {
  selectedEvent: StandardizedEvent | null;
}

export const EventDetails = ({ selectedEvent }: EventDetailsProps) => {
  if (!selectedEvent) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader>
          <CardTitle className="text-lg">Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-blue-300 py-8">
            <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Select an event from the list</p>
            <p className="text-sm mt-1 opacity-70">to see details and images</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
      <CardHeader>
        <CardTitle className="text-lg">Event Details</CardTitle>
      </CardHeader>
      <CardContent>
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
              {selectedEvent.description || 'No description available'}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-blue-300" />
                <span>{formatEventDate(selectedEvent.event_date)}</span>
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
                More Info
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
