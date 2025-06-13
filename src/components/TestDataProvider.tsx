// This component seeds test data into Supabase tables for development purposes.
// It checks if the tables are empty and populates them with sample data.
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  generateSampleChats,
  generateSampleEvents,
  generateSampleNews,   // ✅ now used
} from "@/utils/sampleData";
import { errorLogger } from "@/utils/errorLogger";
import { useToast } from "@/hooks/use-toast";

interface TestDataProviderProps {
  children: React.ReactNode;
}

export const TestDataProvider = ({ children }: TestDataProviderProps) => {
  const { toast } = useToast();               // ✅ now used

  /* ------------------------------------------------------------------ */
  /*  Seed data only in development                                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (import.meta.env.PROD) return;         // only run in dev

    (async () => {
      try {
        await Promise.all([
          seedEvents(),
          seedChats(),
          seedNews(),                         // 👈 new
        ]);
        toast({ title: "Mock data loaded ✅" });
      } catch (err) {
        toast({
          title: "Mock data failed",
          description: (err as Error).message,
          variant: "destructive",
        });
      }
    })();
  }, [toast]);

  /* -------------------------- Helpers ---------------------------------- */
  const seedEvents = async () => {
    const { data } = await supabase.from("berlin_events").select("id").limit(1);
    if (!data?.length) {
      const sample = generateSampleEvents();
      const { error } = await supabase.from("berlin_events").insert(
        sample.map((e) => ({
          title: e.title,
          description: e.description,
          event_date: e.event_date,
          location: e.location,
          image_url: e.image_url,
          category: e.category,
          tags: e.tags,
          source_url: e.source_url,
        }))
      );
      if (error) errorLogger.logSupabaseError("seedEvents", error, "berlin_events");
    }
  };

  const seedChats = async () => {
    const { data } = await supabase.from("chat_rooms").select("id").limit(1);
    if (!data?.length) {
      const sample = generateSampleChats();
      const {
        data: { user },
      } = await supabase.auth.getUser();               // :contentReference[oaicite:3]{index=3}
      if (user) {
        const { error } = await supabase
          .from("chat_rooms")
          .insert(sample.map((c) => ({ ...c, created_by: user.id })));
        if (error) errorLogger.logSupabaseError("seedChats", error, "chat_rooms");
      }
    }
  };

  /* NEW – seed sample news articles ------------------------------------ */
  const seedNews = async () => {
    const { data } = await supabase.from("berlin_news").select("id").limit(1);
    if (!data?.length) {
      const sample = generateSampleNews();
      const { error } = await supabase.from("berlin_news").insert(sample);
      if (error) errorLogger.logSupabaseError("seedNews", error, "berlin_news");
    }
  };

  return <>{children}</>;
};

