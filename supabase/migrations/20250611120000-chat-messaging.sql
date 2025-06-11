-- Add chat messages and participants tables

-- Create chat_messages table for storing chat messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  is_anonymous BOOLEAN DEFAULT false,
  anonymous_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false
);

-- Create chat_participants table for managing room participants
CREATE TABLE public.chat_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_admin BOOLEAN DEFAULT false,
  UNIQUE(room_id, user_id)
);

-- Add RLS policies for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in rooms they participate in
CREATE POLICY "Users can view messages in their rooms" 
  ON public.chat_messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants 
      WHERE chat_participants.room_id = chat_messages.room_id 
      AND chat_participants.user_id = auth.uid()
    )
  );

-- Users can insert messages in rooms they participate in
CREATE POLICY "Users can send messages in their rooms" 
  ON public.chat_messages 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_participants 
      WHERE chat_participants.room_id = chat_messages.room_id 
      AND chat_participants.user_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" 
  ON public.chat_messages 
  FOR UPDATE 
  USING (sender_id = auth.uid());

-- Add RLS policies for chat_participants
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- Users can view participants in rooms they're part of
CREATE POLICY "Users can view participants in their rooms" 
  ON public.chat_participants 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.room_id = chat_participants.room_id 
      AND cp.user_id = auth.uid()
    )
  );

-- Users can join rooms (insert themselves)
CREATE POLICY "Users can join rooms" 
  ON public.chat_participants 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Update chat_rooms table to add last_message tracking
ALTER TABLE public.chat_rooms 
ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN last_message_content TEXT,
ADD COLUMN participant_count INTEGER DEFAULT 0;

-- Enable realtime for chat functionality
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_participants REPLICA IDENTITY FULL;
ALTER TABLE public.chat_rooms REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;

-- Create function to generate anonymous names
CREATE OR REPLACE FUNCTION public.generate_anonymous_name()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'Anon_' || SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8);
$$;

-- Create function to update room stats
CREATE OR REPLACE FUNCTION public.update_room_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update last message info
    UPDATE public.chat_rooms 
    SET 
      last_message_at = NEW.created_at,
      last_message_content = CASE 
        WHEN LENGTH(NEW.content) > 50 THEN LEFT(NEW.content, 50) || '...'
        ELSE NEW.content
      END
    WHERE id = NEW.room_id;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger for updating room stats
CREATE TRIGGER update_room_stats_trigger
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_room_stats();
