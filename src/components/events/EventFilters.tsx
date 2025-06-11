
import { Filter, X, Map } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BERLIN_EVENT_TAGS } from '@/constants/berlin';

interface EventFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  selectedArea: string;
  setSelectedArea: (area: string) => void;
  availableAreas: string[];
}

export const EventFilters = ({
  searchTerm,
  setSearchTerm,
  selectedTags,
  setSelectedTags,
  selectedArea,
  setSelectedArea,
  availableAreas
}: EventFiltersProps) => {
  const toggleTag = (tag: string) => {
    setSelectedTags(
      selectedTags.includes(tag)
        ? selectedTags.filter(t => t !== tag)
        : [...selectedTags, tag]
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Map className="h-4 w-4" />
        <span className="text-sm font-medium">Area Filter</span>
      </div>
      
      <Select value={selectedArea} onValueChange={setSelectedArea}>
        <SelectTrigger className="bg-white/10 border-white/20 text-white">
          <SelectValue placeholder="Select Berlin area" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All areas</SelectItem>
          {availableAreas.map(area => (
            <SelectItem key={area} value={area}>{area}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
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
  );
};
