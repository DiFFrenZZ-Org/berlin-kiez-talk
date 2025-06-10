import fs from 'fs';
import { load } from 'cheerio';

const EVENTS_URL = 'https://www.berlin.de/en/events/';

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

            if (title && title.length > 3) {
              events.push({
                id: String(events.length + 1),
                title,
                description: description || 'Keine Beschreibung verfügbar',
                event_date: date || null,
                location: location || 'Berlin',
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
      console.log('No events found with any selector. The website structure might have changed.');
      // Create a fallback event
      events.push({
        id: "1",
        title: "Fallback Event - Website Structure Changed",
        description: "The Berlin.de website structure has changed. Please update the scraper or check the website manually.",
        event_date: new Date().toISOString().split('T')[0],
        location: "Berlin"
      });
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
      console.log(`${index + 1}. ${event.title} - ${event.event_date} - ${event.location}`);
    });

  } catch (err) {
    console.error('❌ Failed to scrape events:', err.message);

    // Create a fallback events file
    const fallbackEvents = [{
      id: "1",
      title: "Scraping Error - Check Console",
      description: `Failed to scrape events: ${err.message}. Please check your internet connection or the website might be blocking requests.`,
      event_date: new Date().toISOString().split('T')[0],
      location: "Berlin"
    }];

    // Ensure the public directory exists
    if (!fs.existsSync('public')) {
      fs.mkdirSync('public');
    }

    fs.writeFileSync('public/events.json', JSON.stringify(fallbackEvents, null, 2));
    console.log('Created fallback events file');
  }
}

scrape();
