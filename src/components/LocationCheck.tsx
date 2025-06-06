
import { useEffect, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LocationCheckProps {
  onLocationVerified: (inBerlin: boolean) => void;
}

export const LocationCheck = ({ onLocationVerified }: LocationCheckProps) => {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkLocation = async () => {
    setIsChecking(true);
    setError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation wird von diesem Browser nicht unterstützt");
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Berlin approximate boundaries
      const berlinBounds = {
        north: 52.6755,
        south: 52.3382,
        east: 13.7611,
        west: 13.0883
      };

      const inBerlin = latitude >= berlinBounds.south && 
                     latitude <= berlinBounds.north && 
                     longitude >= berlinBounds.west && 
                     longitude <= berlinBounds.east;

      console.log(`Location: ${latitude}, ${longitude} - In Berlin: ${inBerlin}`);
      onLocationVerified(inBerlin);
    } catch (err) {
      console.error("Location check failed:", err);
      setError("Standortüberprüfung fehlgeschlagen. Bitte erlauben Sie den Zugriff auf Ihren Standort.");
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Auto-check location on component mount
    checkLocation();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
            <MapPin className="h-8 w-8 text-blue-300" />
          </div>
          <CardTitle className="text-2xl font-bold">BerlinChat</CardTitle>
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
            Diese App ist nur für Nutzer in Berlin verfügbar. Ihr Standort wird nur zur Überprüfung verwendet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
