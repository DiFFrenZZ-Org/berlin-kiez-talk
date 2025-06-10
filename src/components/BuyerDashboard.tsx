import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/hooks/useAuth';

interface Props {
  userProfile: UserProfile;
}

export const BuyerDashboard = ({ userProfile }: Props) => {
  const [posts, setPosts] = useState(0);
  const [activeChats, setActiveChats] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { count: postCount } = await supabase
      .from('forum_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userProfile.id);
    setPosts(postCount || 0);

    const { count: chatCount } = await supabase
      .from('chat_rooms')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userProfile.id);
    setActiveChats(chatCount || 0);
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
      <CardHeader>
        <CardTitle>Buyer Dashboard</CardTitle>
        <CardDescription className="text-blue-200">Aktivität Übersicht</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-blue-300">Eigene Posts</p>
            <p className="text-2xl font-bold">{posts}</p>
          </div>
          <div>
            <p className="text-sm text-blue-300">Erstellte Chats</p>
            <p className="text-2xl font-bold">{activeChats}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
