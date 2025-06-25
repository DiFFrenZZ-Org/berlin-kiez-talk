import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventsService } from '../eventsService';
import type { StandardizedEvent } from '@/types/events';

const ev = (
  id: string,
  overrides: Partial<StandardizedEvent> = {}
): StandardizedEvent => ({
  id,
  title: `Event ${id}`,
  description: 'Fun time',
  event_date: '2024-01-01',
  location: 'Berlin',
  image_url: '',
  category: 'music',
  tags: ['dance'],
  source_url: '',
  source: 'local',
  ...overrides,
});

let service: EventsService;

beforeEach(() => {
  service = new EventsService();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('EventsService', () => {
  it('aggregates and deduplicates events', async () => {
    vi.spyOn(service as any, 'fetchFromSupabase').mockResolvedValue([ev('1')]);
    vi.spyOn(service as any, 'fetchFromEventbrite').mockResolvedValue([
      ev('2'),
      ev('dup1', { title: 'Event 2' }),
    ]);
    vi.spyOn(service as any, 'fetchFromSerpAPI').mockResolvedValue([
      ev('3'),
      ev('dup2', { title: 'Event 3' }),
    ]);
    vi.spyOn(service as any, 'fetchFromLocalJSON').mockResolvedValue([ev('4')]);

    const results = await service.fetchAllEvents();
    expect(results).toHaveLength(4); // duplicates removed
  });

  it('applies search and tag filters', async () => {
    const events = [
      ev('1', { title: 'Tech meetup', tags: ['tech'] }),
      ev('2', { title: 'Food fest', tags: ['food'] }),
    ];
    vi.spyOn(service as any, 'fetchFromSupabase').mockResolvedValue(events);
    vi.spyOn(service as any, 'fetchFromEventbrite').mockResolvedValue([]);
    vi.spyOn(service as any, 'fetchFromSerpAPI').mockResolvedValue([]);
    vi.spyOn(service as any, 'fetchFromLocalJSON').mockResolvedValue([]);

    const results = await service.fetchAllEvents({ search: 'food', tags: ['food'] });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Food fest');
  });

  it('filters by date', async () => {
    const events = [
      ev('1', { event_date: '2024-01-01' }),
      ev('2', { event_date: '2024-01-02' }),
    ];
    vi.spyOn(service as any, 'fetchFromSupabase').mockResolvedValue(events);
    vi.spyOn(service as any, 'fetchFromEventbrite').mockResolvedValue([]);
    vi.spyOn(service as any, 'fetchFromSerpAPI').mockResolvedValue([]);
    vi.spyOn(service as any, 'fetchFromLocalJSON').mockResolvedValue([]);

    const results = await service.fetchAllEvents({ date: '2024-01-02' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('2');
  });
});
