import { useState, Suspense, lazy } from 'react';
import { useAuth, UserProfile } from '@/hooks/useAuth';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

const ChatInterface = lazy(() =>
  import('@/components/ChatInterface').then((m) => ({ default: m.ChatInterface }))
);

const ChatTest = () => {
  const { profile } = useAuth();
  const [sendAnon, setSendAnon] = useState(false);

  const mockProfile: UserProfile = {
    id: 'mock-id',
    email: 'mock@example.com',
    nickname: 'Mock User',
    user_role: 'buyer',
    borough: 'Berlin',
    subscription_tier: 'pro',
    subscription_active: true,
    verified_local: true,
    reputation_score: 0,
  };

  const userProfile = profile || mockProfile;

  return (
    <div className="min-h-screen p-4 space-y-4 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="flex items-center space-x-2 text-white">
        <Switch id="anon-toggle" checked={sendAnon} onCheckedChange={setSendAnon} />
        <label htmlFor="anon-toggle">Anonymous</label>
      </div>
      <Suspense
        fallback={
          <div className="p-4">
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <ChatInterface
          userProfile={userProfile}
          sendAnon={sendAnon}
          setSendAnon={setSendAnon}
        />
      </Suspense>
    </div>
  );
};

export default ChatTest;
