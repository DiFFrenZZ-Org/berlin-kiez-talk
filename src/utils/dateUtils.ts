
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

export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isTomorrow = (dateString: string): boolean => {
  const date = new Date(dateString);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
};

export const getRelativeDateLabel = (dateString: string): string => {
  if (isToday(dateString)) return "Today";
  if (isTomorrow(dateString)) return "Tomorrow";
  return formatEventDate(dateString);
};
