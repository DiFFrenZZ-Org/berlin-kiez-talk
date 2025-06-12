import { useState } from "react";
import { LocationCheck } from "@/components/LocationCheck";
import { AuthFlow } from "@/components/AuthFlow";
import { Dashboard } from "@/components/Dashboard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, profile, loading } = useAuth();
  const [locationVerifiedState, setLocationVerifiedState] = useState<boolean | null>(null);
  const isLocationVerified = profile?.is_super_admin ? true : locationVerifiedState;
  const { toast } = useToast();

  const handleLocationVerified = (hasAccess: boolean) => {
    console.log('Location verification result:', hasAccess);
    setLocationVerifiedState(hasAccess);
    if (!hasAccess) {
      toast({
        title: "Zugang beschränkt",
        description: "Diese App ist nur für Nutzer in Berlin verfügbar.",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Lädt...</div>
      </div>
    );
  }

  // Show location check first (unless super admin)
  if (isLocationVerified === null) {
    return <LocationCheck onLocationVerified={handleLocationVerified} />;
  }

  // Show access denied if not in Berlin and not super admin
  if (!isLocationVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center text-white space-y-4">
          <h1 className="text-2xl font-bold">Zugang nicht möglich</h1>
          <p className="text-blue-200">Diese App ist nur für Nutzer in Berlin verfügbar.</p>
        </div>
      </div>
    );
  }

  // Show auth flow if not authenticated
  if (!user || !profile) {
    return <AuthFlow />;
  }

  // Show main dashboard
  return <Dashboard userProfile={profile} />;
};

export default Index;
