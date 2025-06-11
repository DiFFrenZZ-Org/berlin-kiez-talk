
import { useState, useEffect } from "react";
import { Send, Plus, Shield } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendChatMessage } from "@/services/sendChatMessage";

interface ChatInterfaceProps {
  userProfile: UserProfile;
  sendAnon?: boolean;
  setSendAnon?: (v: boolean) => void;
}

interface ChatRoom {
  id: string;
  name: string;
  lastMessage?: string | null;
  unread?: number;
  expires_at?: string | null;
}

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_anonymous?: boolean | null;
  anonymous_name?: string | null;
}

export const ChatInterface = ({
  userProfile,
  sendAnon: controlledSendAnon,
  setSendAnon: controlledSetSendAnon,
}: ChatInterfaceProps) => {
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [isTemporary, setIsTemporary] = useState(false);
  const [expiry, setExpiry] = useState<'24' | '48' | '72'>('24');
  const [internalSendAnon, setInternalSendAnon] = useState(false);
  const sendAnon = controlledSendAnon ?? internalSendAnon;
  const setSendAnon = controlledSetSendAnon ?? setInternalSendAnon;
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat);
      const ch = subscribeToRoom(activeChat);
      setChannel(ch);
    } else {
      setMessages([]);
    }
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        setChannel(null);
      }
    };
  }, [activeChat]);

  const fetchChats = async () => {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('fetchChats error', error);
      toast({
        title: 'Fehler',
        description: 'Chats konnten nicht geladen werden',
        variant: 'destructive',
      });
      return;
    }

    if (data) {
      setChats(data);
    }
  };

  const fetchMessages = async (roomId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at');

    if (error) {
      console.error('fetchMessages error', error);
      toast({
        title: 'Fehler',
        description: 'Nachrichten konnten nicht geladen werden',
        variant: 'destructive',
      });
      return;
    }

    if (data) {
      setMessages(data);
    }
  };

  const subscribeToRoom = (roomId: string) => {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((m) => [...m, payload.new as ChatMessage]);
        }
      )
      .subscribe();
    return channel;
  };

  // Update the sendMessage function in ChatInterface:
const sendMessage = async () => {
  if (!message.trim() || !activeChat) return;
  
  // Change this line:
  const { error } = await sendChatMessage({
    roomId: activeChat,
    userId: userProfile.id,
    content: message,
    isAnonymous: sendAnon,
  });

  // To this:
  const result = await sendChatMessage({
    roomId: activeChat,
    userId: userProfile.id,
    content: message,
    isAnonymous: sendAnon,
  });

  if (!result.error) {
    setMessage('');
  } else {
    console.error('sendMessage error', result.error);
  }
};

  const createRoom = async () => {
    if (!newRoomName.trim()) return;

    const insertData: any = {
      name: newRoomName,
      description: newRoomDesc,
      created_by: userProfile.id,
      is_temporary: isTemporary,
    };

    if (isTemporary) {
      const hours = parseInt(expiry, 10);
      insertData.expires_at = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    }

    const { data, error } = await supabase
      .from('chat_rooms')
      .insert(insertData)
      .select()
      .single();

    if (!error && data) {
      await supabase.from('chat_participants').insert({
        room_id: data.id,
        user_id: userProfile.id,
        is_admin: true,
      });
      setChats(prev => [data, ...prev]);
      setOpenCreate(false);
      setNewRoomName('');
      setNewRoomDesc('');
      setIsTemporary(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Chat List */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Chats</CardTitle>
            <Button
              size="sm"
              onClick={() => setOpenCreate(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-blue-200">
            Ende-zu-Ende verschlüsselt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {chats.length === 0 ? (
            <div className="text-center text-blue-300 py-8">
              <p>Keine Chaträume verfügbar</p>
              <p className="text-sm mt-2 opacity-70">Erstellen Sie einen neuen Raum</p>
            </div>
          ) : (
            chats.map((chat) => (
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
                    <Shield className="h-3 w-3 text-green-400" />
                  </div>
                  <div className="flex items-center space-x-2">
                    {chat.expires_at && (
                      <span className="text-xs text-blue-300">
                        {new Date(chat.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {chat.lastMessage && (
                  <p className="text-xs text-blue-200 truncate">{chat.lastMessage}</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Chat Window */}
      <Card className="lg:col-span-2 bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {activeChat ? chats.find(c => c.id === activeChat)?.name : 'Chat auswählen'}
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
                {messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-blue-300">
                    <div className="text-center">
                      <p>Keine Nachrichten in diesem Raum</p>
                      <p className="text-sm mt-2 opacity-70">Chat-Funktionalität wird bald verfügbar sein</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === userProfile.id;
                    const displayName = isOwn
                      ? msg.is_anonymous
                        ? 'Du (Anon)'
                        : 'Du'
                      : msg.is_anonymous
                        ? msg.anonymous_name || 'Anon'
                        : 'User';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            isOwn ? 'bg-blue-600 text-white' : 'bg-white/20 text-white'
                          }`}
                        >
                          <p className="text-xs font-semibold mb-1">{displayName}</p>
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <div className="flex space-x-2 items-center">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nachricht eingeben..."
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      !e.shiftKey &&
                      !e.ctrlKey &&
                      !e.altKey &&
                      !e.metaKey
                    ) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                {(userProfile.subscription_tier === 'pro' || userProfile.subscription_tier === 'premium' || userProfile.user_role === 'seller') && (
                  <div className="flex items-center space-x-1">
                    <Checkbox id="anon-send" checked={sendAnon} onCheckedChange={() => setSendAnon(!sendAnon)} />
                    <label htmlFor="anon-send" className="text-xs">Anonym</label>
                  </div>
                )}
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
      
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="bg-white/10 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Neuen Raum erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Raumname"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            <Input
              placeholder="Beschreibung"
              value={newRoomDesc}
              onChange={(e) => setNewRoomDesc(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            <div className="flex items-center space-x-2">
              <Checkbox id="temp" checked={isTemporary} onCheckedChange={() => setIsTemporary(!isTemporary)} />
              <label htmlFor="temp" className="text-sm">Temporärer Raum</label>
            </div>
            {isTemporary && (
              <Select value={expiry} onValueChange={(v) => setExpiry(v as '24' | '48' | '72')}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Ablauf" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-white">
                  <SelectItem value="24">24 Stunden</SelectItem>
                  <SelectItem value="48">48 Stunden</SelectItem>
                  <SelectItem value="72">72 Stunden</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button onClick={createRoom} className="bg-blue-600 hover:bg-blue-700">Erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
