import fs from 'fs';
import { load } from 'cheerio';

const EVENTS_URL = 'https://www.berlin.de/en/events/';

async function scrape() {
  try {
    const res = await fetch(EVENTS_URL);
    const html = await res.text();
    const $ = load(html);
    const events = [];

    $('.simple-list .simple-list__item').each((_, el) => {
      const title = $(el).find('.simple-list__title').text().trim();
      const date = $(el).find('.simple-list__date').text().trim();
      const location = $(el).find('.simple-list__location').text().trim();
      const description = $(el).find('.simple-list__teaser').text().trim();
      if (title) {
        events.push({
          id: String(events.length + 1),
          title,
          description,
          event_date: date,
          location,
        });
      }
    });

    fs.writeFileSync('public/events.json', JSON.stringify(events, null, 2));
    console.log(`Saved ${events.length} events.`);
  } catch (err) {
    console.error('Failed to scrape events:', err);
  }
}

scrape();
