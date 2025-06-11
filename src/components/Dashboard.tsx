
import { useState } from "react";

import {
  MessageSquare,
  Users,
  MapPin,
  Settings,
  Star,
  CreditCard,
  LogOut,
  Megaphone,
  Calendar,
  Sun,
  Moon,
  Check,
  Crown,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChatInterface } from "@/components/ChatInterface";
import { EnhancedForumList } from "@/components/EnhancedForumList";
import { EnhancedSellerProfiles } from "@/components/EnhancedSellerProfiles";
import { AnnouncementsFeed } from "@/components/AnnouncementsFeed";
import { EnhancedEventsCalendar } from "@/components/EnhancedEventsCalendar";
import { SuperAdminDashboard } from "@/components/SuperAdminDashboard";
import { SellerDashboard } from "@/components/SellerDashboard";
import { BuyerDashboard } from "@/components/BuyerDashboard";
import { useAuth, UserProfile } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface DashboardProps {
  userProfile: UserProfile;
}

export const Dashboard = ({ userProfile }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState<'forum' | 'chat' | 'sellers' | 'announcements' | 'events' | 'profile'>('forum');

  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Fehler",
        description: "Fehler beim Abmelden",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Abgemeldet",
        description: "Sie wurden erfolgreich abgemeldet.",
      });
    }
  };

  const tabs = [
    { id: 'forum', label: 'Forum', icon: Users },
    { id: 'chat', label: 'Chats', icon: MessageSquare },
    { id: 'sellers', label: 'Verkäufer', icon: Star },
    { id: 'announcements', label: 'News', icon: Megaphone },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'profile', label: 'Profil', icon: Settings },
  ];

  const getRoleDisplay = () => {
    if (userProfile.user_role === 'super_admin') return 'Super Admin';
    return userProfile.user_role === 'seller' ? 'Verkäufer' : 'Käufer';
  };

  const getRoleBadgeClass = () => {
    if (userProfile.user_role === 'super_admin') return 'bg-gradient-to-r from-purple-600 to-pink-600 text-white';
    return userProfile.user_role === 'seller' ? 'bg-blue-600' : 'bg-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">KiezTalk</h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right text-sm">
              <div className="text-white font-medium flex items-center space-x-1">
                {userProfile.user_role === 'super_admin' && (
                  <Crown className="h-4 w-4 text-yellow-400" />
                )}
                <span>{userProfile.nickname}</span>
                {userProfile.verified_local && (
                  <Check className="h-4 w-4 text-green-400" />
                )}
                <span className="flex items-center text-yellow-300 ml-1">
                  <Star className="h-3 w-3 mr-0.5 fill-current" />
                  {userProfile.reputation_score}
                </span>
              </div>
              <div className="text-blue-300 text-xs">{userProfile.borough}</div>
            </div>
            <Badge variant="default" className={getRoleBadgeClass()}>
              {getRoleDisplay()}
            </Badge>
            {userProfile.user_role === 'seller' && (
              <Badge 
                variant="outline" 
                className={`${
                  userProfile.subscription_active 
                    ? 'border-green-400 text-green-300' 
                    : 'border-red-400 text-red-300'
                }`}
              >
                <CreditCard className="h-3 w-3 mr-1" />
                {userProfile.subscription_active ? 'Aktiv' : 'Inaktiv'}
              </Badge>
            )}
            <Button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              variant="ghost"
              size="sm"
              className="text-blue-300 hover:text-white"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="text-blue-300 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-white/10 backdrop-blur-md rounded-lg p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={`flex-1 ${
                  activeTab === tab.id 
                    ? "bg-blue-600 text-white" 
                    : "text-blue-200 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'forum' && <EnhancedForumList userProfile={userProfile} />}
          {activeTab === 'chat' && <ChatInterface userProfile={userProfile} />}
          {activeTab === 'sellers' && <EnhancedSellerProfiles userProfile={userProfile} />}
          {activeTab === 'announcements' && <AnnouncementsFeed />}
          {activeTab === 'events' && <EnhancedEventsCalendar />}
          {activeTab === 'profile' && (
            userProfile.user_role === 'super_admin' ? (
              <SuperAdminDashboard userProfile={userProfile} />
            ) : userProfile.user_role === 'seller' ? (
              <SellerDashboard userProfile={userProfile} />
            ) : (
              <BuyerDashboard userProfile={userProfile} />
            )
          )}
        </div>
      </div>
    </div>
  );
};
