import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ChatRoom {
  id: string;
  name: string;
  description?: string | null;
  lastMessage?: string | null;
  last_message_at?: string | null;
  last_message_content?: string | null;
  unread?: number;
  expires_at?: string | null;
  room_type?: string | null;
  avatar_url?: string | null;
  is_encrypted?: boolean | null;
  bridge_type?: string | null;
  participant_count?: number | null;
  created_by?: string | null;
}

const fetchRooms = async () => {
  const { data, error } = await supabase
    .from('chat_rooms')
    .select('*')
    .order('last_message_at', { ascending: false });

  if (error) throw error;
  return data as ChatRoom[];
};

export const useChatRooms = () => {
  return useQuery({ queryKey: ['rooms'], queryFn: fetchRooms });
};
