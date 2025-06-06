
import { useEffect, useState } from "react";
import { LocationCheck } from "@/components/LocationCheck";
import { AuthFlow } from "@/components/AuthFlow";
import { Dashboard } from "@/components/Dashboard";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isInBerlin, setIsInBerlin] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'seller' | 'buyer' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already authenticated
    const savedAuth = localStorage.getItem('berlinChat_auth');
    const savedRole = localStorage.getItem('berlinChat_role') as 'seller' | 'buyer' | null;
    
    if (savedAuth && savedRole) {
      setIsAuthenticated(true);
      setUserRole(savedRole);
    }
  }, []);

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

  const handleAuthComplete = (role: 'seller' | 'buyer') => {
    setIsAuthenticated(true);
    setUserRole(role);
    localStorage.setItem('berlinChat_auth', 'true');
    localStorage.setItem('berlinChat_role', role);
    toast({
      title: "Willkommen!",
      description: `Sie sind als ${role === 'seller' ? 'Verkäufer' : 'Käufer'} angemeldet.`,
    });
  };

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
  if (!isAuthenticated || !userRole) {
    return <AuthFlow onAuthComplete={handleAuthComplete} />;
  }

  // Show main dashboard
  return <Dashboard userRole={userRole} />;
};

export default Index;
