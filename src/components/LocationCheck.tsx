import { useCallback, useEffect, useState } from "react";
import { MapPin, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

interface LocationCheckProps {
  onLocationVerified: (inBerlin: boolean) => void;
}

export const LocationCheck = ({
  onLocationVerified,
}: LocationCheckProps): JSX.Element => {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile, loading: authLoading } = useAuth();

  /* ------------------------------------------------------------------ */
  /*  Memoised checker                                                  */
  /* ------------------------------------------------------------------ */
  const checkLocation = useCallback(async (): Promise<void> => {
    setIsChecking(true);
    setError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation wird von diesem Browser nicht unterstützt");
      }

      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, {
          enableHighAccuracy: true,
          timeout: 10_000,
          maximumAge: 60_000,
        })
      );

      const { latitude, longitude } = pos.coords;

      /* Berlin bounds approx. */
      const berlin = {
        north: 52.6755,
        south: 52.3382,
        east: 13.7611,
        west: 13.0883,
      };

      const inBerlin =
        latitude >= berlin.south &&
        latitude <= berlin.north &&
        longitude >= berlin.west &&
        longitude <= berlin.east;

      const hasAccess = inBerlin || profile?.is_super_admin === true;
      onLocationVerified(hasAccess);
    } catch (err) {
      console.error("Location check failed:", err);
      setError(
        "Standortüberprüfung fehlgeschlagen. Bitte erlauben Sie den Zugriff auf Ihren Standort."
      );
    } finally {
      setIsChecking(false);
    }
  }, [onLocationVerified, profile?.is_super_admin]);

  /* ------------------------------------------------------------------ */
  /*  Auto-check when auth ready                                        */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (authLoading) return;

    // super-admin bypass
    if (profile?.is_super_admin) {
      onLocationVerified(true);
      return;
    }

    void checkLocation();
  }, [authLoading, profile?.is_super_admin, checkLocation, onLocationVerified]);

  /* ------------------------------------------------------------------ */
  /*  Render helpers                                                    */
  /* ------------------------------------------------------------------ */
  const isAdmin = profile?.is_super_admin === true;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-white flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Lädt...</span>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-green-300" />
            </div>
            <CardTitle className="text-2xl font-bold">Super-Admin Zugang</CardTitle>
            <CardDescription className="text-green-200">
              Sie haben als Super-Admin Zugriff auf die Anwendung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-300 mb-4" />
              <p className="text-green-200">Gewähre Zugang...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Normal location gate                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
            <MapPin className="h-8 w-8 text-blue-300" />
          </div>
          <CardTitle className="text-2xl font-bold">KiezTalk</CardTitle>
          <CardDescription className="text-blue-200">
            Sichere, anonyme Kommunikation für Berlin
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error ? (
            <div className="space-y-4">
              <p className="text-red-300 text-sm text-center">{error}</p>
              <Button
                onClick={checkLocation}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Überprüfe...
                  </>
                ) : (
                  "Standort erneut prüfen"
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              {isChecking ? (
                <>
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-300" />
                  <p className="text-blue-200">Überprüfe Ihren Standort...</p>
                </>
              ) : (
                <Button
                  onClick={checkLocation}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Standort überprüfen
                </Button>
              )}
            </div>
          )}

          <p className="text-xs text-blue-300 text-center">
            Diese App ist nur für Nutzer in Berlin verfügbar. Ihr Standort wird
            nur zur Überprüfung verwendet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
