import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { UserProfile } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PublicProfilePage = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("nickname", username)
        .maybeSingle();

      setProfile((data as UserProfile) || null);
      setLoading(false);
    };

    if (username) fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="p-4">
        <Skeleton className="w-full h-8" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Profil nicht gefunden
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 text-white">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader>
            <CardTitle>{profile.nickname}</CardTitle>
            <CardDescription className="text-blue-200">
              {profile.borough}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>Reputation: {profile.reputation_score}</div>
              <div>Rolle: {profile.user_role === "seller" ? "Verkäufer" : "Käufer"}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicProfilePage;

