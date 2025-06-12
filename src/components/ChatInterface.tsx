import { useState, useEffect, useRef } from "react";
import { Send, Plus, Shield, Paperclip, Smile, MoreHorizontal, Search, Trash, Archive } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  description?: string | null;
  lastMessage?: string | null;
  last_message_at?: string | null;
  last_message_content?: string | null;
  unread?: number;
  expires_at?: string | null;
  room_type?: string | null;
  avatar_url?: string | null;
  is_encrypted?: boolean | null;
  bridge_type?: string | null;
  participant_count?: number | null;
  created_by?: string | null;
}

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_anonymous?: boolean | null;
  anonymous_name?: string | null;
  reply_to?: string | null;
  reactions?: any;
  attachments?: any[];
  priority?: 'normal' | 'low' | 'urgent';
  status?: 'unread' | 'read' | 'archived';
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
  const [roomType, setRoomType] = useState<'group' | 'channel'>('group');
  const [internalSendAnon, setInternalSendAnon] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const sendAnon = controlledSendAnon ?? internalSendAnon;
  const setSendAnon = controlledSetSendAnon ?? setInternalSendAnon;
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        title: 'Error',
        description: 'Could not load chat rooms',
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
        title: 'Error',
        description: 'Could not load messages',
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

  const sendMessage = async () => {
    if (!message.trim() || !activeChat) return;
    
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

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', userProfile.id); // Only allow deleting own messages

    if (!error) {
      setMessages(messages.filter(m => m.id !== messageId));
      toast({
        title: "Message deleted",
        description: "Your message has been deleted.",
      });
    } else {
      toast({
        title: "Error",
        description: "Could not delete message.",
        variant: "destructive",
      });
    }
  };

  const deleteRoom = async (roomId: string) => {
    const room = chats.find(c => c.id === roomId);
    const canDelete = room?.created_by === userProfile.id || userProfile.user_role === 'super_admin';
    
    if (!canDelete) {
      toast({
        title: "Permission denied",
        description: "You can only delete rooms you created.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('chat_rooms')
      .delete()
      .eq('id', roomId);

    if (!error) {
      setChats(chats.filter(c => c.id !== roomId));
      if (activeChat === roomId) {
        setActiveChat(null);
      }
      toast({
        title: "Room deleted",
        description: "Chat room has been deleted.",
      });
    } else {
      toast({
        title: "Error",
        description: "Could not delete room.",
        variant: "destructive",
      });
    }
  };

  const classifyMessage = async (messageId: string, status: 'unread' | 'read' | 'archived', priority?: 'normal' | 'low' | 'urgent') => {
    const { error } = await supabase
      .from('chat_messages')
      .update({ 
        status,
        ...(priority && { priority })
      })
      .eq('id', messageId);

    if (!error) {
      setMessages(messages.map(m => 
        m.id === messageId 
          ? { ...m, status, ...(priority && { priority }) }
          : m
      ));
      toast({
        title: "Message updated",
        description: `Message marked as ${status}${priority ? ` with ${priority} priority` : ''}.`,
      });
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;

    const insertData: any = {
      name: newRoomName,
      description: newRoomDesc,
      created_by: userProfile.id,
      is_temporary: isTemporary,
      room_type: roomType,
      is_encrypted: true,
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

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeRoom = chats.find(c => c.id === activeChat);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'low': return 'text-gray-400';
      default: return 'text-white';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'unread': return <Badge variant="outline" className="text-xs bg-blue-600/20">Unread</Badge>;
      case 'archived': return <Badge variant="outline" className="text-xs bg-gray-600/20">Archived</Badge>;
      default: return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-slate-900/50 backdrop-blur-md rounded-lg border border-white/20 overflow-hidden">
      {/* Sidebar - Chat List */}
      <div className="w-80 bg-slate-800/50 border-r border-white/20 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Messages</h2>
            <Button
              size="sm"
              onClick={() => setOpenCreate(true)}
              className="bg-blue-600 hover:bg-blue-700 h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <p>No conversations found</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`p-4 cursor-pointer border-b border-white/10 hover:bg-slate-700/30 transition-colors group ${
                  activeChat === chat.id ? 'bg-blue-600/20 border-r-2 border-r-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={chat.avatar_url || ''} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {chat.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0" onClick={() => setActiveChat(chat.id)}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white text-sm truncate">{chat.name}</span>
                        {chat.is_encrypted && <Shield className="h-3 w-3 text-green-400" />}
                        {chat.bridge_type && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {chat.bridge_type}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {chat.last_message_at && (
                          <span className="text-xs text-gray-400">
                            {new Date(chat.last_message_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        )}
                        {(chat.created_by === userProfile.id || userProfile.user_role === 'super_admin') && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteRoom(chat.id);
                                }}
                                className="text-red-400"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete Room
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    
                    {chat.last_message_content && (
                      <p className="text-xs text-gray-400 truncate">{chat.last_message_content}</p>
                    )}
                    
                    {chat.expires_at && (
                      <p className="text-xs text-yellow-400 mt-1">
                        Expires: {new Date(chat.expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChat && activeRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/20 bg-slate-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activeRoom.avatar_url || ''} />
                    <AvatarFallback className="bg-blue-600 text-white text-sm">
                      {activeRoom.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-semibold text-white">{activeRoom.name}</h3>
                    <div className="flex items-center space-x-2">
                      {activeRoom.is_encrypted && (
                        <div className="flex items-center space-x-1">
                          <Shield className="h-3 w-3 text-green-400" />
                          <span className="text-xs text-green-400">End-to-end encrypted</span>
                        </div>
                      )}
                      {activeRoom.participant_count && (
                        <span className="text-xs text-gray-400">
                          {activeRoom.participant_count} members
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <p>No messages in this room yet</p>
                    <p className="text-sm mt-2 opacity-70">Send the first message!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isOwn = msg.sender_id === userProfile.id;
                  const displayName = isOwn
                    ? msg.is_anonymous ? 'You (Anonymous)' : 'You'
                    : msg.is_anonymous ? msg.anonymous_name || 'Anonymous' : 'User';
                  
                  const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender_id !== msg.sender_id);
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                        index > 0 && messages[index - 1].sender_id === msg.sender_id ? 'mt-1' : 'mt-4'
                      } group`}
                    >
                      {!isOwn && showAvatar && (
                        <Avatar className="h-6 w-6 mr-2 mt-1">
                          <AvatarFallback className="bg-gray-600 text-white text-xs">
                            {displayName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      {!isOwn && !showAvatar && <div className="w-8" />}
                      
                      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'ml-auto' : ''} relative`}>
                        {showAvatar && !isOwn && (
                          <p className="text-xs font-medium text-gray-300 mb-1 ml-1">{displayName}</p>
                        )}
                        
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isOwn 
                              ? 'bg-blue-600 text-white rounded-br-sm' 
                              : 'bg-slate-700 text-white rounded-bl-sm'
                          } ${getPriorityColor(msg.priority)}`}
                        >
                          <div className="flex items-start justify-between">
                            <p className="text-sm whitespace-pre-wrap flex-1">{msg.content}</p>
                            
                            {/* Message Actions */}
                            <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {isOwn && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteMessage(msg.id)}
                                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                                >
                                  <Trash className="h-3 w-3" />
                                </Button>
                              )}
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                  >
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => classifyMessage(msg.id, 'unread')}>
                                    Mark as Unread
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => classifyMessage(msg.id, 'archived')}>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => classifyMessage(msg.id, 'read', 'urgent')}>
                                    Mark as Urgent
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => classifyMessage(msg.id, 'read', 'low')}>
                                    Mark as Low Priority
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs opacity-70">
                              {new Date(msg.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                            {getStatusBadge(msg.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/20 bg-slate-800/30">
              <div className="flex items-end space-x-2">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white mb-2">
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <div className="flex-1">
                  {/* Anonymous toggle for eligible users */}
                  {(userProfile.subscription_tier === 'pro' || 
                    userProfile.subscription_tier === 'premium' || 
                    userProfile.user_role === 'seller') && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox 
                        id="anon-send" 
                        checked={sendAnon} 
                        onCheckedChange={() => setSendAnon(!sendAnon)} 
                      />
                      <label htmlFor="anon-send" className="text-xs text-gray-300">
                        Send anonymously
                      </label>
                    </div>
                  )}
                  
                  <div className="flex items-end space-x-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 min-h-[40px] resize-none"
                      style={{ minHeight: '40px' }}
                    />
                    
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <Smile className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      onClick={sendMessage} 
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={!message.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Welcome to KiezTalk</h3>
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Create Room Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="bg-slate-800 border-slate-600 text-white">
          <DialogHeader>
            <DialogTitle>Create New Room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
            />
            <Input
              placeholder="Description (optional)"
              value={newRoomDesc}
              onChange={(e) => setNewRoomDesc(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
            />
            
            <Select value={roomType} onValueChange={(v) => setRoomType(v as 'group' | 'channel')}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Room type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 text-white">
                <SelectItem value="group">Group Chat</SelectItem>
                <SelectItem value="channel">Channel</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="temp" checked={isTemporary} onCheckedChange={() => setIsTemporary(!isTemporary)} />
              <label htmlFor="temp" className="text-sm">Temporary room</label>
            </div>
            
            {isTemporary && (
              <Select value={expiry} onValueChange={(v) => setExpiry(v as '24' | '48' | '72')}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Expires in" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 text-white">
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                  <SelectItem value="72">72 hours</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button onClick={createRoom} className="bg-blue-600 hover:bg-blue-700">
              Create Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
