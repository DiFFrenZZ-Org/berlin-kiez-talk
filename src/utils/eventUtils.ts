
import { AREA_KEYWORDS, EVENT_TYPE_KEYWORDS } from '@/constants/berlin';

export const formatEventDate = (dateString: string | null) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric" 
  });
};

export const inferCategory = (title: string, description: string = ''): string => {
  const content = `${title} ${description}`.toLowerCase();
  
  if (content.includes('music') || content.includes('concert') || content.includes('band')) return 'Music';
  if (content.includes('art') || content.includes('gallery') || content.includes('exhibition')) return 'Art';
  if (content.includes('food') || content.includes('restaurant') || content.includes('cuisine')) return 'Food & Drink';
  if (content.includes('tech') || content.includes('startup') || content.includes('digital')) return 'Science & Tech';
  if (content.includes('sport') || content.includes('fitness') || content.includes('yoga')) return 'Sports & Fitness';
  if (content.includes('theater') || content.includes('play') || content.includes('drama')) return 'Performing Arts';
  
  return 'Other';
};

export const generateEventTags = (event: any): string[] => {
  const tags: string[] = [];
  const title = event.title?.toLowerCase() || '';
  const description = event.description?.toLowerCase() || '';
  const location = event.location?.toLowerCase() || '';
  const content = `${title} ${description} ${location}`;

  [...AREA_KEYWORDS, ...EVENT_TYPE_KEYWORDS].forEach(({ tag, keywords }) => {
    if (keywords.some(keyword => content.includes(keyword))) {
      tags.push(tag);
    }
  });

  return tags;
};

export const removeDuplicateEvents = (events: any[]) => {
  const seen = new Set<string>();
  return events.filter(event => {
    const key = `${event.title}-${event.event_date}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};
