import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_anonymous?: boolean | null;
  anonymous_name?: string | null;
  reply_to?: string | null;
  reactions?: any;
  attachments?: any[];
}

const fetchMessages = async (roomId: string) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at');

  if (error) throw error;
  return data as ChatMessage[];
};

export const useRoomMessages = (roomId: string | null) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['rooms', roomId, 'messages'],
    queryFn: () => fetchMessages(roomId as string),
    enabled: !!roomId,
  });

  useEffect(() => {
    if (!roomId) return;

    const channel: RealtimeChannel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        payload => {
          queryClient.setQueryData<ChatMessage[]>(['rooms', roomId, 'messages'], old => [...(old || []), payload.new as ChatMessage]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  return query;
};
