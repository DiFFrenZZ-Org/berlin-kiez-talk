import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Users, Store, ToggleRight } from "lucide-react";
import { UserProfile } from "@/hooks/useAuth";
import { SellerDashboard } from "@/components/SellerDashboard";
import { BuyerDashboard } from "@/components/BuyerDashboard";
import { useToast } from "@/hooks/use-toast";

type UserRole = 'seller' | 'buyer' | 'super_admin';

interface SuperAdminDashboardProps {
  userProfile: UserProfile;
}

const RoleCard = ({ 
  role, 
  onSwitchBack 
}: {
  role: 'seller' | 'buyer';
  onSwitchBack: () => void;
}) => (
  <Card className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-md border-white/20 text-white">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Crown className="h-5 w-5 text-yellow-400" />
          <span className="text-sm">Super Admin Mode - Viewing as {role.charAt(0).toUpperCase() + role.slice(1)}</span>
        </div>
        <Button 
          onClick={onSwitchBack} 
          variant="outline" 
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <ToggleRight className="h-4 w-4 mr-1" />
          Back to Admin
        </Button>
      </div>
    </CardContent>
  </Card>
);

const StatsCard = ({ icon: Icon, title, value, color }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: React.ReactNode;
  color: string;
}) => (
  <div className="text-center">
    <div className="bg-white/10 rounded-lg p-4 mb-2">
      <Icon className={`h-8 w-8 mx-auto ${color}`} />
    </div>
    <p className="text-sm text-blue-300">{title}</p>
    {typeof value === 'string' ? (
      <p className="text-2xl font-bold">{value}</p>
    ) : value}
  </div>
);

export const SuperAdminDashboard = ({ userProfile }: SuperAdminDashboardProps) => {
  const [viewAsRole, setViewAsRole] = useState<UserRole>('super_admin');
  const { toast } = useToast();

  const handleRoleSwitch = (role: UserRole) => {
    setViewAsRole(role);
    toast({
      title: "Dashboard View Changed",
      description: `Now viewing as: ${role === 'super_admin' ? 'Super Admin' : role}`,
    });
  };

  if (viewAsRole === 'seller') {
    return (
      <div className="space-y-4">
        <RoleCard 
          role="seller" 
          onSwitchBack={() => handleRoleSwitch('super_admin')} 
        />
        <SellerDashboard userProfile={userProfile} />
      </div>
    );
  }

  if (viewAsRole === 'buyer') {
    return (
      <div className="space-y-4">
        <RoleCard 
          role="buyer" 
          onSwitchBack={() => handleRoleSwitch('super_admin')} 
        />
        <BuyerDashboard userProfile={userProfile} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-md border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Crown className="h-6 w-6 mr-2 text-yellow-400" />
            Super Admin Dashboard
          </CardTitle>
          <CardDescription className="text-blue-200">
            System administration and role switching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard 
              icon={Users} 
              title="Total Users" 
              value="Admin Access" 
              color="text-blue-300" 
            />
            <StatsCard 
              icon={Store} 
              title="System Status" 
              value={<Badge className="bg-green-600">Active</Badge>} 
              color="text-green-300" 
            />
            <StatsCard 
              icon={Crown} 
              title="Admin Level" 
              value="Super" 
              color="text-yellow-300" 
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Role Switching</h3>
            <p className="text-sm text-blue-300">
              Switch between different user roles to test the dashboard experience:
            </p>
            <div className="flex space-x-2">
              <Button 
                onClick={() => handleRoleSwitch('seller')} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Store className="h-4 w-4 mr-2" />
                View as Seller
              </Button>
              <Button 
                onClick={() => handleRoleSwitch('buyer')} 
                className="bg-green-600 hover:bg-green-700"
              >
                <Users className="h-4 w-4 mr-2" />
                View as Buyer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
