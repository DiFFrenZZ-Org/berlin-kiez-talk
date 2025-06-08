
import { useEffect, useState } from "react";
import { LocationCheck } from "@/components/LocationCheck";
import { AuthFlow } from "@/components/AuthFlow";
import { Dashboard } from "@/components/Dashboard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [isInBerlin, setIsInBerlin] = useState<boolean | null>(null);
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();

  const handleLocationVerified = (inBerlin: boolean) => {
    setIsInBerlin(inBerlin);
    if (!inBerlin) {
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

  // Show location check first
  if (isInBerlin === null) {
    return <LocationCheck onLocationVerified={handleLocationVerified} />;
  }

  // Show access denied if not in Berlin
  if (!isInBerlin) {
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
