import { useLocation } from "wouter";
import { useState, useEffect, useRef, useMemo } from "react";
import { MessageSquare, Send, Search, Loader2, Clock, User, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PremiumPageContainer } from "@/components/premium/PremiumPageContainer";
import { PremiumPageHeader } from "@/components/premium/PremiumPageHeader";
import { PremiumCard } from "@/components/premium/PremiumCard";
import { PremiumInput } from "@/components/premium/PremiumInput";
import { PremiumButton } from "@/components/premium/PremiumButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function MessagesPage() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  // Parse query parameters from URL
  const urlParams = useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const userIdParam = searchParams.get('userId');
    const propertyIdParam = searchParams.get('propertyId');
    
    return {
      userId: userIdParam ? parseInt(userIdParam) : null,
      propertyId: propertyIdParam ? parseInt(propertyIdParam) : null,
    };
  }, [location]);

  // Set selectedConversationId from URL params
  useEffect(() => {
    if (urlParams.userId) {
      const userId = urlParams.userId;
      if (user && userId === user.id) return;
      setSelectedConversationId(userId);
      setShowMobileChat(true);
    }
    
    if (urlParams.propertyId) {
      setPropertyId(urlParams.propertyId);
    }
  }, [urlParams.userId, urlParams.propertyId, user]);

  const utils = trpc.useUtils();

  // Fetch conversations
  const { data: conversationsData, isLoading: conversationsLoading, refetch: refetchConversations } = trpc.messages.listConversations.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  // Fetch messages for selected conversation
  const activeUserId = selectedConversationId;
  const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } = trpc.messages.getConversation.useQuery(
    activeUserId!,
    {
      enabled: isAuthenticated && activeUserId !== null,
      refetchInterval: 5000,
      retry: false,
    }
  );

  // Fetch user info for new conversations
  const { data: recipientUserInfo, isLoading: recipientInfoLoading } = trpc.messages.getUserInfo.useQuery(
    { userId: activeUserId! },
    { enabled: isAuthenticated && activeUserId !== null }
  );

  // Send message mutation
  const sendMessageMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      setMessageText("");
      refetchMessages();
      refetchConversations();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  // Combine existing conversations with the selected user from URL
  const allConversations = useMemo(() => {
    const existing = conversationsData || [];
    
    if (urlParams.userId) {
      const existsInList = existing.some((c: any) => c.partnerId === urlParams.userId);
      
      if (!existsInList) {
        const conversationItem = {
          partnerId: urlParams.userId,
          partnerName: recipientUserInfo?.name || `User ${urlParams.userId}`,
          partnerEmail: recipientUserInfo?.email || "",
          lastMessage: "",
          lastMessageTime: null,
          unreadCount: 0,
        };
        return [conversationItem, ...existing];
      }
    }
    
    return existing;
  }, [conversationsData, urlParams.userId, recipientUserInfo]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!allConversations) return [];
    return allConversations.filter((conv: any) =>
      conv.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allConversations, searchQuery]);

  // Format messages
  const formattedMessages = useMemo(() => {
    if (!messagesData || !user) return [];
    return messagesData.map((msg: any) => ({
      ...msg,
      isSent: msg.senderId === user.id,
    }));
  }, [messagesData, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (shouldAutoScroll.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [formattedMessages.length]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversationId || sendMessageMutation.isPending) return;

    shouldAutoScroll.current = true;
    sendMessageMutation.mutate({
      recipientId: selectedConversationId,
      content: messageText.trim(),
      propertyId: propertyId || urlParams.propertyId || undefined,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleConversationSelect = (partnerId: number) => {
    setSelectedConversationId(partnerId);
    setShowMobileChat(true);
  };

  const handleBackToConversations = () => {
    setShowMobileChat(false);
    // Optional: Keep selection but hide chat view on mobile
    // setSelectedConversationId(null); 
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">Please sign in to access messages</p>
      </div>
    );
  }

  return (
    <PremiumPageContainer>
      <PremiumPageHeader 
        title="Messages" 
        subtitle="Communicate directly with landlords and tenants"
        icon={MessageSquare}
      />

      <div className="flex h-[calc(100vh-280px)] min-h-[600px] gap-6 overflow-hidden rounded-3xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-xl backdrop-blur-sm relative">
        {/* Conversations Sidebar - Hidden on mobile when chat is active */}
        <div className={`
          w-full md:w-80 border-r-2 border-slate-200 dark:border-slate-700 flex flex-col bg-slate-50/50 dark:bg-slate-900/50
          ${showMobileChat ? 'hidden md:flex' : 'flex'}
        `}>
          <div className="p-4 border-b-2 border-slate-200 dark:border-slate-700">
            <PremiumInput
              icon={Search}
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversationsLoading && !urlParams.userId ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
              </div>
            ) : filteredConversations.length === 0 && !urlParams.userId ? (
              <div className="p-8 text-center text-slate-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredConversations.map((conv: any) => {
                  const isSelected = selectedConversationId === conv.partnerId;
                  return (
                    <button
                      key={conv.partnerId}
                      onClick={() => handleConversationSelect(conv.partnerId)}
                      className={`w-full p-4 text-left transition-all hover:bg-white dark:hover:bg-slate-800 ${
                        isSelected 
                          ? "bg-white dark:bg-slate-800 border-l-4 border-cyan-500 shadow-sm" 
                          : "border-l-4 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-700 shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold">
                            {conv.partnerName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`font-bold truncate text-sm ${isSelected ? "text-cyan-600 dark:text-cyan-400" : "text-slate-900 dark:text-slate-100"}`}>
                              {conv.partnerName}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                            <p className="truncate max-w-[140px]">
                              {conv.lastMessage || "Start chatting..."}
                            </p>
                            {conv.lastMessageTime && (
                              <span className="opacity-70 whitespace-nowrap ml-2">
                                {formatTime(conv.lastMessageTime)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area - Hidden on mobile when list is active */}
        <div className={`
          flex-1 flex flex-col bg-white dark:bg-slate-800 relative
          ${!showMobileChat ? 'hidden md:flex' : 'flex'}
        `}>
          {selectedConversationId ? (
            <>
              {/* Chat Header */}
              <div className="border-b-2 border-slate-200 dark:border-slate-700 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md sticky top-0 z-10 flex items-center gap-3">
                {/* Mobile Back Button */}
                <button 
                  onClick={handleBackToConversations}
                  className="md:hidden p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </button>

                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-10 w-10 border-2 border-slate-100 dark:border-slate-700">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold">
                      {recipientUserInfo?.name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {recipientUserInfo?.name || "Loading..."}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                      Online
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div 
                className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/30"
                onScroll={(e) => {
                  const target = e.currentTarget;
                  const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
                  shouldAutoScroll.current = isNearBottom;
                }}
              >
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                  </div>
                ) : formattedMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                      <MessageSquare className="h-10 w-10 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">No messages yet</p>
                    <p className="text-xs text-slate-400 mt-1">Start the conversation by sending a message below.</p>
                  </div>
                ) : (
                  <>
                    {formattedMessages.map((msg: any, idx: number) => {
                      const showAvatar = idx === 0 || formattedMessages[idx - 1].senderId !== msg.senderId;
                      return (
                        <div key={msg.id} className={`flex gap-3 ${msg.isSent ? "justify-end" : "justify-start"}`}>
                          {!msg.isSent && showAvatar && (
                            <Avatar className="h-8 w-8 mt-1 border border-slate-200 dark:border-slate-700">
                              <AvatarFallback className="bg-white dark:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 font-bold">
                                {recipientUserInfo?.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {!msg.isSent && !showAvatar && <div className="w-8" />}
                          
                          <div className={`max-w-[75%] lg:max-w-[60%] group relative`}>
                            <div className={`px-5 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                              msg.isSent
                                ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-tr-none"
                                : "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-600"
                            }`}>
                              {msg.content}
                            </div>
                            <p className={`text-[10px] mt-1 flex items-center gap-1 opacity-60 px-1 ${
                              msg.isSent ? "justify-end text-slate-500" : "text-slate-500"
                            }`}>
                              {formatTime(msg.createdAt)}
                              {msg.isSent && (
                                <span className={msg.isRead ? "text-green-500" : "text-slate-400"}>
                                  {msg.isRead ? "✓✓" : "✓"}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700">
                <div className="flex gap-3 items-end">
                  <div className="flex-1 relative">
                    <textarea
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={sendMessageMutation.isPending}
                      rows={1}
                      className="w-full min-h-[50px] max-h-[150px] px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none resize-none scrollbar-hide font-medium text-sm"
                      style={{ height: 'auto' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
                      }}
                    />
                  </div>
                  <PremiumButton
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    className="h-[50px] w-[50px] rounded-xl p-0 flex items-center justify-center flex-shrink-0"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5 ml-0.5" />
                    )}
                  </PremiumButton>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50">
              <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-md">
                <MessageSquare className="h-10 w-10 text-cyan-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No Conversation Selected</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs text-center">
                Choose a conversation from the sidebar or start a new one to begin messaging.
              </p>
            </div>
          )}
        </div>
      </div>
    </PremiumPageContainer>
  );
}
