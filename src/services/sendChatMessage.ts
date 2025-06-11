import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ChatMessageInsert {
  room_id: string;
  sender_id: string;
  content: string;
  is_anonymous?: boolean;
  anonymous_name?: string | null;
}

/**
 * Inserts a chat message into the database.
 * Displays a toast if row level security prevents the insert.
 */
export async function sendChatMessage(message: ChatMessageInsert) {
  const { error } = await supabase.from("chat_messages").insert(message);

  if (error) {
    // 42501 is the Postgres code for insufficient privilege / RLS violation
    if (error.code === "42501") {
      toast({
        title: "Fehler",
        description: "Du bist nicht berechtigt, in diesem Chat zu schreiben.",
        variant: "destructive",
      });
      console.error("RLS violation while sending chat message:", error.details);
    }
  }

  return { error };
}
