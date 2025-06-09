
import { useState } from "react";
import { MessageSquare, Users, MapPin, Settings, Star, CreditCard, LogOut, Megaphone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChatInterface } from "@/components/ChatInterface";
import { EnhancedForumList } from "@/components/EnhancedForumList";
import { EnhancedSellerProfiles } from "@/components/EnhancedSellerProfiles";
import { AnnouncementsFeed } from "@/components/AnnouncementsFeed";
import { EventsCalendar } from "@/components/EventsCalendar";
import { UserProfile } from "@/hooks/useAuth";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface DashboardProps {
  userProfile: UserProfile;
}

export const Dashboard = ({ userProfile }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState<'forum' | 'chat' | 'sellers' | 'announcements' | 'events' | 'profile'>('forum');
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
              <div className="text-white font-medium">{userProfile.nickname}</div>
              <div className="text-blue-300 text-xs">{userProfile.borough}</div>
            </div>
            <Badge variant={userProfile.user_role === 'seller' ? 'default' : 'secondary'} className="bg-blue-600">
              {userProfile.user_role === 'seller' ? 'Verkäufer' : 'Käufer'}
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
          {activeTab === 'events' && <EventsCalendar />}
          {activeTab === 'profile' && (
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
                        <span className="ml-2">{userProfile.nickname}</span>
                      </div>
                      <div>
                        <span className="text-blue-300">Bezirk:</span>
                        <span className="ml-2">{userProfile.borough}</span>
                      </div>
                      <div>
                        <span className="text-blue-300">Rolle:</span>
                        <span className="ml-2">{userProfile.user_role === 'seller' ? 'Verkäufer' : 'Käufer'}</span>
                      </div>
                      <div>
                        <span className="text-blue-300">Reputation:</span>
                        <span className="ml-2">{userProfile.reputation_score}</span>
                      </div>
                    </div>
                  </div>
                  {userProfile.user_role === 'seller' && (
                    <div>
                      <h3 className="font-semibold mb-2">Verkäufer-Status</h3>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-blue-300">Abo-Tier:</span>
                          <span className="ml-2 capitalize">{userProfile.subscription_tier}</span>
                        </div>
                        <div>
                          <span className="text-blue-300">Status:</span>
                          <span className={`ml-2 ${userProfile.subscription_active ? 'text-green-400' : 'text-red-400'}`}>
                            {userProfile.subscription_active ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
