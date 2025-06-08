
import { useState } from "react";
import { Send, Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "@/hooks/useAuth";

interface ChatInterfaceProps {
  userProfile: UserProfile;
}

export const ChatInterface = ({ userProfile }: ChatInterfaceProps) => {
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState<string | null>(null);

  const mockChats = [
    {
      id: '1',
      name: 'anonymous_user_123',
      lastMessage: 'Hallo, ist das Angebot noch verfügbar?',
      timestamp: '14:30',
      unread: 2,
      encrypted: true
    },
    {
      id: '2',
      name: 'berlin_seller_456',
      lastMessage: 'Danke für das Interesse!',
      timestamp: '13:45',
      unread: 0,
      encrypted: true
    }
  ];

  const mockMessages = [
    {
      id: '1',
      sender: 'anonymous_user_123',
      message: 'Hallo, ist das Angebot noch verfügbar?',
      timestamp: '14:25',
      isOwn: false
    },
    {
      id: '2',
      sender: 'me',
      message: 'Ja, es ist noch verfügbar. Was möchten Sie wissen?',
      timestamp: '14:27',
      isOwn: true
    },
    {
      id: '3',
      sender: 'anonymous_user_123',
      message: 'Können wir uns heute treffen?',
      timestamp: '14:30',
      isOwn: false
    }
  ];

  const sendMessage = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Chat List */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Chats</CardTitle>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-blue-200">
            Ende-zu-Ende verschlüsselt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                activeChat === chat.id 
                  ? 'bg-blue-600/30 border border-blue-400/50' 
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{chat.name}</span>
                  {chat.encrypted && <Shield className="h-3 w-3 text-green-400" />}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-blue-300">{chat.timestamp}</span>
                  {chat.unread > 0 && (
                    <Badge className="bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0">
                      {chat.unread}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-blue-200 truncate">{chat.lastMessage}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Chat Window */}
      <Card className="lg:col-span-2 bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {activeChat ? 'anonymous_user_123' : 'Chat auswählen'}
              </CardTitle>
              {activeChat && (
                <div className="flex items-center space-x-2 mt-1">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-green-400">Ende-zu-Ende verschlüsselt</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col h-[400px]">
          {activeChat ? (
            <>
              {/* Messages */}
              <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
                {mockMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.isOwn
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">{msg.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex space-x-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nachricht eingeben..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                <Button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-blue-300">
              <p>Wählen Sie einen Chat aus, um zu beginnen</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
