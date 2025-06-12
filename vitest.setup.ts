import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Basic Supabase client stub so components can import it in tests
vi.mock('@/integrations/supabase/client', () => {
  const mockFrom = vi.fn(() => ({
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  }));
  return { supabase: { from: mockFrom } };
});
