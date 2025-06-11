import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

  // Generate anonymous name if needed
  if (isAnonymous) {
    const { data } = await supabase.rpc('generate_anonymous_name');
    anonymousName = data as string;
  }

  const response = await supabase.from('chat_messages').insert({
    room_id: roomId,
    sender_id: userId,
    content,
    is_anonymous: isAnonymous,
    anonymous_name: anonymousName,
  });

  // Handle RLS violation errors
  if (response.error) {
    // 42501 is the Postgres code for insufficient privilege / RLS violation
    if (response.error.code === '42501') {
      toast({
        title: 'Fehler',
        description: 'Du bist nicht berechtigt, in diesem Chat zu schreiben.',
        variant: 'destructive',
      });
      console.error('RLS violation while sending chat message:', response.error.details);
    }
    return response;
  }

  return response;
}