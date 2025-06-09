import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !profile)) {
      navigate("/");
    }
  }, [loading, user, profile, navigate]);

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">Lädt...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription className="text-blue-200">
              Verwalten Sie Ihr Konto und Ihre Einstellungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Benutzerinformationen</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-300">Nickname:</span>
                    <span className="ml-2">{profile.nickname}</span>
                  </div>
                  <div>
                    <span className="text-blue-300">Bezirk:</span>
                    <span className="ml-2">{profile.borough}</span>
                  </div>
                  <div>
                    <span className="text-blue-300">Rolle:</span>
                    <span className="ml-2">{profile.user_role === "seller" ? "Verkäufer" : "Käufer"}</span>
                  </div>
                  <div>
                    <span className="text-blue-300">Reputation:</span>
                    <span className="ml-2">{profile.reputation_score}</span>
                  </div>
                </div>
              </div>
              {profile.user_role === "seller" && (
                <div>
                  <h3 className="font-semibold mb-2">Verkäufer-Status</h3>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-blue-300">Abo-Tier:</span>
                      <span className="ml-2 capitalize">{profile.subscription_tier}</span>
                    </div>
                    <div>
                      <span className="text-blue-300">Status:</span>
                      <span className={`ml-2 ${profile.subscription_active ? "text-green-400" : "text-red-400"}`}>
                        {profile.subscription_active ? "Aktiv" : "Inaktiv"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
