/* ------------------------------------------------------------------ */
/*  TestDataProvider – seeds dev data in Supabase once per session    */
/* ------------------------------------------------------------------ */
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  generateSampleChats,
  generateSampleEvents,
  generateSampleNews,
} from "@/utils/sampleData";
import { errorLogger } from "@/utils/errorLogger";
import { useToast } from "@/hooks/use-toast";

interface TestDataProviderProps {
  children: React.ReactNode;
}

export const TestDataProvider = ({ children }: TestDataProviderProps) => {
  const { toast } = useToast();

  /* one flag per table so we don’t re-seed on every hot-reload */
  const seededNews  = useRef(false);
  const seededChats = useRef(false);
  const seededEvents = useRef(false);

  /* ------------------------------------------------------------------ */
  /*  Seed data only in development                                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (import.meta.env.PROD) return;          // never run in production

    (async () => {
      try {
        await Promise.all([
          seedEvents(),
          seedChats(),
          //seedNews(),
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);                                       // run once on mount

  /* -------------------------- Helpers -------------------------------- */

  const seedEvents = async () => {
    if (seededEvents.current) return;
    seededEvents.current = true;

    const { count } = await supabase
      .from("berlin_events")
      .select("id", { head: true, count: "exact" });

    if (count && count > 0) return;            // already filled

    const sample = generateSampleEvents();
    const { error } = await supabase
      .from("berlin_events")
      .insert(
        sample.map((e) => ({
          title: e.title,
          description: e.description,
          event_date: e.event_date,
          location: e.location,
          image_url: e.image_url,
          category: e.category,
          tags: e.tags,
          source_url: e.source_url,
        })),
        { returning: "minimal" }               // no heavy payload back
      );

    if (error) errorLogger.logSupabaseError("seedEvents", error, "berlin_events");
  };

  const seedChats = async () => {
    if (seededChats.current) return;
    seededChats.current = true;

    const { count } = await supabase
      .from("chat_rooms")
      .select("id", { head: true, count: "exact" });

    if (count && count > 0) return;

    const sample = generateSampleChats();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("chat_rooms")
      .insert(
        sample.map((c) => ({ ...c, created_by: user.id })),
        { returning: "minimal" }
      );

    if (error) errorLogger.logSupabaseError("seedChats", error, "chat_rooms");
  };

  const seedNews = async () => {
    if (seededNews.current) return;
    seededNews.current = true;

    const { count, error: countErr } = await supabase
      .from("berlin_news")
      .select("id", { head: true, count: "exact" }); // cheap HEAD request

    if (countErr) {
      errorLogger.logSupabaseError("seedNews.count", countErr, "berlin_news");
      return;
    }
    if (count && count > 0) return;                   // already filled

    const sample = generateSampleNews();

    const { error } = await supabase
      .from("berlin_news")
      .insert(sample, { returning: "minimal" });       // ✅ no .select()

    if (error) errorLogger.logSupabaseError("seedNews.insert", error, "berlin_news");
  };

  /* ------------------------------------------------------------------ */
  /*  Render children unchanged                                          */
  /* ------------------------------------------------------------------ */
  return <>{children}</>;
};

export default TestDataProvider;
