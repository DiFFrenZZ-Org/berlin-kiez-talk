
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateSampleChats, generateSampleEvents, generateSampleNews } from '@/utils/sampleData';
import { errorLogger } from '@/utils/errorLogger';
import { useToast } from '@/hooks/use-toast';

interface TestDataProviderProps {
  children: React.ReactNode;
}

export const TestDataProvider = ({ children }: TestDataProviderProps) => {
  const { toast } = useToast();

  useEffect(() => {
    const initializeTestData = async () => {
      try {
        // Check if we're in development mode
        if (process.env.NODE_ENV !== 'development') {
          return;
        }

        console.log('Initializing test data...');

        // Initialize sample events in Supabase
        await initializeSampleEvents();
        
        // Initialize sample chat rooms
        await initializeSampleChats();

        console.log('Test data initialization completed');
        
      } catch (error) {
        console.error('Error initializing test data:', error);
        errorLogger.logError({
          error: error as Error,
          context: 'INITIALIZE_TEST_DATA'
        });
      }
    };

    initializeTestData();
  }, []);

  const initializeSampleEvents = async () => {
    try {
      // Check if events already exist
      const { data: existingEvents, error: checkError } = await supabase
        .from('berlin_events')
        .select('id')
        .limit(1);

      if (checkError) {
        console.error('Error checking existing events:', checkError);
        return;
      }

      // Only add sample events if none exist
      if (existingEvents && existingEvents.length === 0) {
        const sampleEvents = generateSampleEvents();
        
        const { error: insertError } = await supabase
          .from('berlin_events')
          .insert(sampleEvents.map(event => ({
            title: event.title,
            description: event.description,
            event_date: event.event_date,
            location: event.location,
            image_url: event.image_url,
            category: event.category,
            tags: event.tags,
            source_url: event.source_url
          })));

        if (insertError) {
          console.error('Error inserting sample events:', insertError);
          errorLogger.logSupabaseError('initializeSampleEvents', insertError, 'berlin_events');
        } else {
          console.log('Sample events inserted successfully');
        }
      }
    } catch (error) {
      console.error('Error in initializeSampleEvents:', error);
      errorLogger.logError({
        error: error as Error,
        context: 'INITIALIZE_SAMPLE_EVENTS'
      });
    }
  };

  const initializeSampleChats = async () => {
    try {
      // Check if chat rooms already exist
      const { data: existingRooms, error: checkError } = await supabase
        .from('chat_rooms')
        .select('id')
        .limit(1);

      if (checkError) {
        console.error('Error checking existing chat rooms:', checkError);
        return;
      }

      // Only add sample chats if none exist
      if (existingRooms && existingRooms.length === 0) {
        const sampleChats = generateSampleChats();
        
        // Get current user to set as creator
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { error: insertError } = await supabase
            .from('chat_rooms')
            .insert(sampleChats.map(chat => ({
              ...chat,
              created_by: user.id
            })));

          if (insertError) {
            console.error('Error inserting sample chat rooms:', insertError);
            errorLogger.logSupabaseError('initializeSampleChats', insertError, 'chat_rooms');
          } else {
            console.log('Sample chat rooms inserted successfully');
          }
        }
      }
    } catch (error) {
      console.error('Error in initializeSampleChats:', error);
      errorLogger.logError({
        error: error as Error,
        context: 'INITIALIZE_SAMPLE_CHATS'
      });
    }
  };

  return <>{children}</>;
};
