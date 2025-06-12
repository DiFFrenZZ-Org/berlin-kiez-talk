
import { StandardizedEvent } from '@/types/events';

export const generateSampleEvents = (): StandardizedEvent[] => {
  return [
    {
      id: 'sample-1',
      title: 'Berlin Tech Meetup',
      description: 'Join us for an evening of tech talks and networking in the heart of Berlin.',
      event_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      location: 'Tech Hub Berlin, Mitte',
      image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
      category: 'Technology',
      tags: ['tech', 'networking', 'meetup'],
      source_url: 'https://example.com/tech-meetup',
      source: 'local' as const
    },
    {
      id: 'sample-2',
      title: 'Kreuzberg Art Walk',
      description: 'Explore the vibrant street art scene in Kreuzberg with local artists.',
      event_date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
      location: 'Kreuzberg, Berlin',
      image_url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400',
      category: 'Art',
      tags: ['art', 'culture', 'walking tour'],
      source_url: 'https://example.com/art-walk',
      source: 'local' as const
    },
    {
      id: 'sample-3',
      title: 'Farmers Market Prenzlauer Berg',
      description: 'Fresh local produce and organic goods every Saturday morning.',
      event_date: new Date(Date.now() + 259200000).toISOString().split('T')[0], // 3 days from now
      location: 'Kollwitzplatz, Prenzlauer Berg',
      image_url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400',
      category: 'Market',
      tags: ['food', 'organic', 'market'],
      source_url: 'https://example.com/farmers-market',
      source: 'local' as const
    }
  ];
};

export const generateSampleNews = () => {
  return [
    {
      id: 'news-1',
      title: 'New Bike Lanes Coming to Friedrichshain',
      content: 'The district will add 5km of protected bike lanes to improve cycling safety.',
      created_at: new Date().toISOString(),
      borough: 'Friedrichshain',
      category: 'Transportation'
    },
    {
      id: 'news-2',
      title: 'Community Garden Project in Neukölln',
      content: 'Residents can now apply to participate in the new community garden initiative.',
      created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      borough: 'Neukölln',
      category: 'Community'
    }
  ];
};

export const generateSampleChats = () => {
  return [
    {
      name: 'Mitte Neighbors',
      description: 'Discussion for Mitte district residents',
      room_type: 'group',
      is_encrypted: true,
      borough: 'Mitte'
    },
    {
      name: 'Berlin Events',
      description: 'Share and discover local events',
      room_type: 'channel',
      is_encrypted: true,
      borough: null
    },
    {
      name: 'Tech Community',
      description: 'For Berlin tech enthusiasts',
      room_type: 'group',
      is_encrypted: true,
      borough: null
    }
  ];
};
