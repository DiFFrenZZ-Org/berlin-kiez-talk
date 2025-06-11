import { supabase } from '@/integrations/supabase/client';

interface SendChatMessageParams {
  roomId: string;
  userId: string;
  content: string;
  isAnonymous: boolean;
}

export async function sendChatMessage({
  roomId,
  userId,
  content,
  isAnonymous,
}: SendChatMessageParams) {
  let anonymousName: string | null = null;

  if (isAnonymous) {
    const { data } = await supabase.rpc('generate_anonymous_name');
    anonymousName = data as string;
  }

  return supabase.from('chat_messages').insert({
    room_id: roomId,
    sender_id: userId,
    content,
    is_anonymous: isAnonymous,
    anonymous_name: anonymousName,
  });
}
