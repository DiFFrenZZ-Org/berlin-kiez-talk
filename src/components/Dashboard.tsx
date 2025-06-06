
import { useState } from "react";
import { MessageSquare, Users, MapPin, Settings, Star, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChatInterface } from "@/components/ChatInterface";
import { ForumList } from "@/components/ForumList";
import { SellerProfiles } from "@/components/SellerProfiles";

interface DashboardProps {
  userRole: 'seller' | 'buyer';
}

export const Dashboard = ({ userRole }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'forum' | 'sellers' | 'profile'>('chat');

  const tabs = [
    { id: 'chat', label: 'Chats', icon: MessageSquare },
    { id: 'forum', label: 'Forum', icon: Users },
    { id: 'sellers', label: 'Verkäufer', icon: Star },
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
            <h1 className="text-xl font-bold text-white">BerlinChat</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant={userRole === 'seller' ? 'default' : 'secondary'} className="bg-blue-600">
              {userRole === 'seller' ? 'Verkäufer' : 'Käufer'}
            </Badge>
            {userRole === 'seller' && (
              <Badge variant="outline" className="border-green-400 text-green-300">
                <CreditCard className="h-3 w-3 mr-1" />
                Aktiv
              </Badge>
            )}
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
          {activeTab === 'chat' && <ChatInterface userRole={userRole} />}
          {activeTab === 'forum' && <ForumList />}
          {activeTab === 'sellers' && <SellerProfiles />}
          {activeTab === 'profile' && (
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
              <CardHeader>
                <CardTitle>Profil</CardTitle>
                <CardDescription className="text-blue-200">
                  Verwalten Sie Ihr Konto und Ihre Einstellungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-blue-200">Profil-Einstellungen kommen bald...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
