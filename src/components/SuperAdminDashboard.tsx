
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Crown, Users, Store, Switch } from "lucide-react";
import { UserProfile } from "@/hooks/useAuth";
import { SellerDashboard } from "@/components/SellerDashboard";
import { BuyerDashboard } from "@/components/BuyerDashboard";
import { useToast } from "@/hooks/use-toast";

interface SuperAdminDashboardProps {
  userProfile: UserProfile;
}

export const SuperAdminDashboard = ({ userProfile }: SuperAdminDashboardProps) => {
  const [viewAsRole, setViewAsRole] = useState<'seller' | 'buyer' | 'super_admin'>('super_admin');
  const { toast } = useToast();

  const handleRoleSwitch = (role: 'seller' | 'buyer' | 'super_admin') => {
    setViewAsRole(role);
    toast({
      title: "Dashboard View Changed",
      description: `Now viewing as: ${role === 'super_admin' ? 'Super Admin' : role}`,
    });
  };

  if (viewAsRole === 'seller') {
    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-md border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-yellow-400" />
                <span className="text-sm">Super Admin Mode - Viewing as Seller</span>
              </div>
              <Button 
                onClick={() => handleRoleSwitch('super_admin')} 
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Switch className="h-4 w-4 mr-1" />
                Back to Admin
              </Button>
            </div>
          </div>
        </Card>
        <SellerDashboard userProfile={userProfile} />
      </div>
    );
  }

  if (viewAsRole === 'buyer') {
    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-md border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-yellow-400" />
                <span className="text-sm">Super Admin Mode - Viewing as Buyer</span>
              </div>
              <Button 
                onClick={() => handleRoleSwitch('super_admin')} 
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Switch className="h-4 w-4 mr-1" />
                Back to Admin
              </Button>
            </div>
          </div>
        </Card>
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
            <div className="text-center">
              <div className="bg-white/10 rounded-lg p-4 mb-2">
                <Users className="h-8 w-8 mx-auto text-blue-300" />
              </div>
              <p className="text-sm text-blue-300">Total Users</p>
              <p className="text-2xl font-bold">Admin Access</p>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-lg p-4 mb-2">
                <Store className="h-8 w-8 mx-auto text-green-300" />
              </div>
              <p className="text-sm text-blue-300">System Status</p>
              <Badge className="bg-green-600">Active</Badge>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-lg p-4 mb-2">
                <Crown className="h-8 w-8 mx-auto text-yellow-300" />
              </div>
              <p className="text-sm text-blue-300">Admin Level</p>
              <p className="text-2xl font-bold">Super</p>
            </div>
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
