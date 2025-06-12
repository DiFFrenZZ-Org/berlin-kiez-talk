import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatInterface } from '../ChatInterface';

vi.mock('@/hooks/useChatRooms', () => ({
  useChatRooms: () => ({ data: [], refetch: vi.fn() }),
}));
vi.mock('@/hooks/useRoomMessages', () => ({
  useRoomMessages: () => ({ data: [], refetch: vi.fn() }),
}));
vi.mock('@/services/sendChatMessage', () => ({
  sendChatMessage: vi.fn(),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

const userProfile = {
  id: '1',
  email: 'test@example.com',
  nickname: null,
  user_role: 'buyer',
  borough: null,
  subscription_tier: null,
  subscription_active: null,
  verified_local: null,
  reputation_score: null,
};

describe('ChatInterface', () => {
  it('renders placeholder when no chat is active', () => {
    render(<ChatInterface userProfile={userProfile as any} />);
    expect(screen.getByText('Welcome to KiezTalk')).toBeInTheDocument();
  });
});
