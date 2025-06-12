
import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Plus, Shield, Paperclip, Smile, MoreHorizontal, Search, Trash, Archive } from "lucide-react";
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
import { useChatRooms, ChatRoom } from "@/hooks/useChatRooms";
import { useRoomMessages, ChatMessage } from "@/hooks/useRoomMessages";

interface ChatInterfaceProps {
  userProfile: UserProfile;
  sendAnon?: boolean;
  setSendAnon?: (v: boolean) => void;
}


export const ChatInterface = ({
  userProfile,
  sendAnon: controlledSendAnon,
  setSendAnon: controlledSetSendAnon,
}: ChatInterfaceProps) => {
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const { data: chats = [], refetch: refetchRooms } = useChatRooms();
  const { data: messages = [], refetch: refetchMessages } = useRoomMessages(activeChat);
  const [openCreate, setOpenCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [isTemporary, setIsTemporary] = useState(false);
  const [expiry, setExpiry] = useState<'__placeholder' | '24' | '48' | '72'>(
    "__placeholder"
  );
  const [roomType, setRoomType] = useState<'__placeholder' | 'group' | 'channel'>(
    "__placeholder"
  );
  const [internalSendAnon, setInternalSendAnon] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const sendAnon = controlledSendAnon ?? internalSendAnon;
  const setSendAnon = controlledSetSendAnon ?? setInternalSendAnon;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // refetch rooms when component mounts to ensure fresh data
  useEffect(() => {
    refetchRooms();
  }, [refetchRooms]);

  // old data fetching handled by React Query hooks now

  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeChat) throw new Error('No active chat');
      return sendChatMessage({
        roomId: activeChat,
        userId: userProfile.id,
        content,
        isAnonymous: sendAnon,
      });
    },
    onMutate: async (content: string) => {
      if (!activeChat) return { previous: [] as ChatMessage[] };
      await queryClient.cancelQueries({ queryKey: ['rooms', activeChat, 'messages'] });
      const previous = queryClient.getQueryData<ChatMessage[]>(['rooms', activeChat, 'messages']) || [];

      const optimistic: ChatMessage = {
        id: `temp-${Date.now()}`,
        room_id: activeChat,
        sender_id: userProfile.id,
        content,
        created_at: new Date().toISOString(),
        is_anonymous: sendAnon,
        anonymous_name: sendAnon ? 'Anonymous' : null,
      };

      queryClient.setQueryData<ChatMessage[]>(['rooms', activeChat, 'messages'], [...previous, optimistic]);
      setMessage('');
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (activeChat) {
        queryClient.setQueryData(['rooms', activeChat, 'messages'], context?.previous || []);
      }
      toast({ title: 'Error', description: 'Could not send message', variant: 'destructive' });
    },
    onSettled: () => {
      if (activeChat) queryClient.invalidateQueries({ queryKey: ['rooms', activeChat, 'messages'] });
    },
  });

  const sendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const deleteMessage = async (messageId: string) => {
    try {
      console.log('Deleting message:', messageId);
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', userProfile.id);

      if (!error) {
        console.log('Message deleted successfully');
        if (activeChat) {
          queryClient.setQueryData<ChatMessage[]>(
            ['rooms', activeChat, 'messages'],
            (old = []) => old.filter(m => m.id !== messageId)
          );
        }
        toast({
          title: "Message deleted",
          description: "Your message has been deleted.",
        });
      } else {
        console.error('deleteMessage error:', error);
        toast({
          title: "Error",
          description: "Could not delete message.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('deleteMessage unexpected error:', err);
      toast({
        title: "Error",
        description: "Unexpected error deleting message.",
        variant: "destructive",
      });
    }
  };

  const deleteRoom = async (roomId: string) => {
    try {
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

      console.log('Deleting room:', roomId);
      const { error } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', roomId);

      if (!error) {
        console.log('Room deleted successfully');
        queryClient.setQueryData<ChatRoom[]>(['rooms'], (old = []) => old.filter(c => c.id !== roomId));
        if (activeChat === roomId) {
          setActiveChat(null);
        }
        toast({
          title: "Room deleted",
          description: "Chat room has been deleted.",
        });
      } else {
        console.error('deleteRoom error:', error);
        toast({
          title: "Error",
          description: "Could not delete room.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('deleteRoom unexpected error:', err);
      toast({
        title: "Error",
        description: "Unexpected error deleting room.",
        variant: "destructive",
      });
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;

    try {
      console.log('Creating new room...', { name: newRoomName, type: roomType });
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
        console.log('Room created successfully:', data.id);
        await supabase.from('chat_participants').insert({
          room_id: data.id,
          user_id: userProfile.id,
          is_admin: true,
        });
        queryClient.setQueryData<ChatRoom[]>(['rooms'], (old = []) => [data, ...(old || [])]);
        setOpenCreate(false);
        setNewRoomName('');
        setNewRoomDesc('');
        setIsTemporary(false);
        toast({
          title: "Room created",
          description: "New chat room has been created.",
        });
      } else {
        console.error('createRoom error:', error);
        toast({
          title: "Error",
          description: "Could not create room.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('createRoom unexpected error:', err);
      toast({
        title: "Error",
        description: "Unexpected error creating room.",
        variant: "destructive",
      });
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeRoom = chats.find(c => c.id === activeChat);

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
            <div
              className="flex-1 overflow-y-auto p-4 space-y-4"
              aria-live="polite"
            >
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
                          }`}
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
                                  <DropdownMenuItem>Mark as Unread</DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>Mark as Urgent</DropdownMenuItem>
                                  <DropdownMenuItem>Mark as Low Priority</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
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
                <SelectItem value="__placeholder" disabled>
                  Room type
                </SelectItem>
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
                  <SelectItem value="__placeholder" disabled>
                    Expires in
                  </SelectItem>
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
