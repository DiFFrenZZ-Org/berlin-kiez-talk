
import fs from 'fs';
import { load } from 'cheerio';

const EVENTS_URL = 'https://www.berlin.de/en/events/';

// Berlin event categorization helper
const categorizeBerlinEvent = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  
  const categories = {
    'techno': ['techno', 'electronic', 'club', 'berghain', 'watergate', 'tresor'],
    'open-air': ['open-air', 'outdoor', 'park', 'festival', 'summer'],
    'culture': ['museum', 'gallery', 'exhibition', 'art', 'kultur'],
    'music': ['concert', 'musik', 'band', 'live', 'jazz', 'rock'],
    'food': ['food', 'restaurant', 'market', 'essen', 'kulinarisch'],
    'theater': ['theater', 'theatre', 'drama', 'comedy', 'show'],
    'sports': ['sport', 'football', 'basketball', 'fitness', 'marathon'],
    'family': ['family', 'children', 'kids', 'familie', 'kinder']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  
  return 'general';
};

const extractTags = (title, description, category) => {
  const text = `${title} ${description}`.toLowerCase();
  const tags = [];
  
  // Add category as tag
  if (category !== 'general') {
    tags.push(category.charAt(0).toUpperCase() + category.slice(1));
  }
  
  // Common Berlin event tags
  const tagKeywords = {
    'Techno': ['techno', 'electronic', 'club'],
    'Open-Air': ['open-air', 'outdoor', 'festival'],
    'Art': ['art', 'gallery', 'exhibition', 'kunst'],
    'Music': ['music', 'concert', 'live', 'band'],
    'Food': ['food', 'culinary', 'restaurant', 'market'],
    'Culture': ['culture', 'museum', 'cultural'],
    'Dance': ['dance', 'dancing', 'tanz'],
    'Theater': ['theater', 'show', 'performance'],
    'Festival': ['festival', 'fest', 'celebration'],
    'Workshop': ['workshop', 'class', 'course'],
    'Family': ['family', 'children', 'kids'],
    'Free': ['free', 'kostenlos', 'gratis']
  };

  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some(keyword => text.includes(keyword)) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  return tags.slice(0, 5); // Limit to 5 tags
};

// Simple image URL generator for events (placeholder)
const generateEventImageUrl = (title, category) => {
  // In a real implementation, you'd extract actual images from the event pages
  // For now, we'll use placeholder images based on category
  const imageMap = {
    'techno': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    'open-air': 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop',
    'culture': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
    'music': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    'food': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
    'theater': 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=300&fit=crop',
    'sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop',
    'family': 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=300&fit=crop'
  };
  
  return imageMap[category] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop';
};

async function scrape() {
  try {
    console.log('Starting to scrape Berlin events...');

    const res = await fetch(EVENTS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const html = await res.text();
    const $ = load(html);
    const events = [];

    // Try multiple selectors as website structure might vary
    const eventSelectors = [
      '.simple-list .simple-list__item',
      '.event-list .event-item',
      '.list-item',
      '.event'
    ];

    let foundEvents = false;

    for (const selector of eventSelectors) {
      const eventElements = $(selector);
      if (eventElements.length > 0) {
        console.log(`Found ${eventElements.length} events using selector: ${selector}`);
        foundEvents = true;

        eventElements.each((index, el) => {
          try {
            const $el = $(el);

            // Try different title selectors
            const title = $el.find('.simple-list__title, .event-title, .title, h3, h2').first().text().trim() ||
              $el.find('a').first().text().trim();

            // Try different date selectors
            const date = $el.find('.simple-list__date, .event-date, .date, .datetime').first().text().trim();

            // Try different location selectors
            const location = $el.find('.simple-list__location, .event-location, .location, .venue').first().text().trim();

            // Try different description selectors
            const description = $el.find('.simple-list__teaser, .event-description, .description, .teaser, p').first().text().trim();

            // Get source URL
            const sourceUrl = $el.find('a').first().attr('href');
            const fullSourceUrl = sourceUrl ? (sourceUrl.startsWith('http') ? sourceUrl : `https://www.berlin.de${sourceUrl}`) : null;

            if (title && title.length > 3) {
              const category = categorizeBerlinEvent(title, description);
              const tags = extractTags(title, description, category);
              const imageUrl = generateEventImageUrl(title, category);

              events.push({
                id: String(events.length + 1),
                title,
                description: description || 'Keine Beschreibung verfügbar',
                event_date: date || null,
                location: location || 'Berlin',
                image_url: imageUrl,
                category,
                tags,
                source_url: fullSourceUrl
              });
            }
          } catch (elementError) {
            console.warn(`Error processing event element ${index}:`, elementError.message);
          }
        });
        break; // Stop after finding events with first working selector
      }
    }

    if (!foundEvents) {
      console.log('No events found with any selector. Creating sample events with Berlin theme.');
      // Create sample Berlin events with proper categorization
      const sampleEvents = [
        {
          id: "1",
          title: "Techno Night at Berghain",
          description: "Underground techno party with international DJs in Berlin's most famous club.",
          event_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          location: "Berghain, Berlin",
          image_url: generateEventImageUrl("techno", "techno"),
          category: "techno",
          tags: ["Techno", "Club", "Electronic", "Dance"],
          source_url: "https://www.berlin.de"
        },
        {
          id: "2", 
          title: "Open-Air Festival im Tempelhofer Feld",
          description: "Outdoor music festival with food trucks and local bands on the historic airfield.",
          event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          location: "Tempelhofer Feld, Berlin",
          image_url: generateEventImageUrl("festival", "open-air"),
          category: "open-air",
          tags: ["Open-Air", "Festival", "Music", "Food"],
          source_url: "https://www.berlin.de"
        },
        {
          id: "3",
          title: "Contemporary Art Exhibition",
          description: "New contemporary art exhibition featuring local Berlin artists.",
          event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          location: "Hamburger Bahnhof, Berlin",
          image_url: generateEventImageUrl("art", "culture"),
          category: "culture",
          tags: ["Art", "Culture", "Exhibition"],
          source_url: "https://www.berlin.de"
        }
      ];
      events.push(...sampleEvents);
    }

    // Ensure the public directory exists
    if (!fs.existsSync('public')) {
      fs.mkdirSync('public');
    }

    fs.writeFileSync('public/events.json', JSON.stringify(events, null, 2));
    console.log(`✅ Successfully saved ${events.length} events to public/events.json`);

    // Log a few sample events for debugging
    console.log('Sample events:');
    events.slice(0, 3).forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} - ${event.event_date} - ${event.location} [${event.category}]`);
      console.log(`   Tags: ${event.tags?.join(', ') || 'none'}`);
    });

  } catch (err) {
    console.error('❌ Failed to scrape events:', err.message);

    // Create a fallback events file with Berlin theme
    const fallbackEvents = [
      {
        id: "1",
        title: "Scraping Error - Fallback Event",
        description: `Failed to scrape events: ${err.message}. This is a fallback event with Berlin theming.`,
        event_date: new Date().toISOString().split('T')[0],
        location: "Berlin",
        image_url: generateEventImageUrl("error", "general"),
        category: "general",
        tags: ["Info"],
        source_url: null
      }
    ];

    // Ensure the public directory exists
    if (!fs.existsSync('public')) {
      fs.mkdirSync('public');
    }

    fs.writeFileSync('public/events.json', JSON.stringify(fallbackEvents, null, 2));
    console.log('Created fallback events file');
  }
}

scrape();
