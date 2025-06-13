import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel, RealtimePostgresInsertPayload } from "@supabase/supabase-js";

/* ------------------------------------------------------------------ */
/*  Message model                                                     */
/* ------------------------------------------------------------------ */

export interface ReactionMap {
  /** key = emoji or reaction label, value = total count */
  [reaction: string]: number;
}

export interface Attachment {
  /** presigned or public URL */
  url: string;
  /** mime-type, e.g. image/png, video/mp4 */
  type: string;
  /** optional original filename */
  name?: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_anonymous?: boolean | null;
  anonymous_name?: string | null;
  reply_to?: string | null;
  reactions?: ReactionMap | null;
  attachments?: Attachment[] | null;
}

/* ------------------------------------------------------------------ */
/*  Helper: fetch existing messages                                   */
/* ------------------------------------------------------------------ */
const fetchMessages = async (roomId: string): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at");

  if (error) throw error;
  return (data ?? []) as ChatMessage[];
};

/* ------------------------------------------------------------------ */
/*  Main hook                                                         */
/* ------------------------------------------------------------------ */
export const useRoomMessages = (roomId: string | null) => {
  const queryClient = useQueryClient();

  /* initial query --------------------------------------------------- */
  const query = useQuery({
    queryKey: ["rooms", roomId, "messages"],
    queryFn: () => fetchMessages(roomId as string),
    enabled: Boolean(roomId),
  });

  /* realtime subscription ------------------------------------------- */
  useEffect(() => {
    if (!roomId) return;

    const channel: RealtimeChannel = supabase
      .channel(`room-${roomId}`)
      .on<RealtimePostgresInsertPayload<ChatMessage>>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          queryClient.setQueryData<ChatMessage[]>(
            ["rooms", roomId, "messages"],
            (old = []) => [...old, payload.new],
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);

  return query;
};
