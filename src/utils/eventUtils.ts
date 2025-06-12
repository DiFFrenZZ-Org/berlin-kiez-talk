
import { StandardizedEvent } from '@/types/events';

export const removeDuplicateEvents = (events: StandardizedEvent[]): StandardizedEvent[] => {
  const seen = new Set();
  return events.filter(event => {
    const key = `${event.title}-${event.event_date}-${event.location}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export const inferCategory = (title: string, description?: string | null): string => {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  if (text.includes('techno') || text.includes('club') || text.includes('dj')) return 'techno';
  if (text.includes('art') || text.includes('gallery') || text.includes('exhibition')) return 'culture';
  if (text.includes('food') || text.includes('restaurant') || text.includes('market')) return 'food';
  if (text.includes('festival') || text.includes('open-air') || text.includes('outdoor')) return 'open-air';
  if (text.includes('workshop') || text.includes('learn') || text.includes('course')) return 'workshop';
  if (text.includes('sport') || text.includes('fitness') || text.includes('run')) return 'sports';
  
  return 'other';
};

export const generateEventTags = (event: any): string[] => {
  const tags: string[] = [];
  
  if (event.tags && Array.isArray(event.tags)) {
    tags.push(...event.tags);
  }
  
  if (event.category) {
    tags.push(event.category);
  }
  
  // Generate tags based on title and description
  const text = `${event.title} ${event.description || ''}`.toLowerCase();
  
  if (text.includes('free')) tags.push('Free');
  if (text.includes('outdoor') || text.includes('open-air')) tags.push('Outdoor');
  if (text.includes('indoor')) tags.push('Indoor');
  if (text.includes('family')) tags.push('Family-friendly');
  if (text.includes('kids') || text.includes('children')) tags.push('Kids');
  if (text.includes('music')) tags.push('Music');
  if (text.includes('food') || text.includes('drink')) tags.push('Food & Drink');
  if (text.includes('art') || text.includes('culture')) tags.push('Culture');
  if (text.includes('workshop') || text.includes('learn')) tags.push('Educational');
  
  return [...new Set(tags)]; // Remove duplicates
};

export const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  
  // Check if it's today
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  
  // Check if it's tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }
  
  // Return formatted date
  return date.toLocaleDateString("de-DE", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric" 
  });
};
