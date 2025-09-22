"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Hash, 
  Volume2, 
  Settings, 
  UserPlus,
  Smile,
  Plus,
  Send,
  ChevronDown,
  ChevronRight,
  Users,
  MessageSquare,
  ArrowLeft,
  BookOpen,
  Users2,
  Hash as HashIcon
} from "lucide-react";

const mockServers = [
  {
    id: "1",
    name: "Physics 101",
    avatar: "P",
    color: "bg-blue-500",
    unread: 10,
    channels: [
      { id: "1", name: "general", type: "text", unread: 3 },
      { id: "2", name: "assignments", type: "text", unread: 0 },
      { id: "3", name: "study-group", type: "voice", unread: 0 },
      { id: "4", name: "lab-discussions", type: "text", unread: 7 }
    ]
  },
  {
    id: "2", 
    name: "Computer Science",
    avatar: "CS",
    color: "bg-green-500",
    unread: 1,
    channels: [
      { id: "5", name: "general", type: "text", unread: 1 },
      { id: "6", name: "coding-help", type: "text", unread: 0 },
      { id: "7", name: "project-team", type: "voice", unread: 0 }
    ]
  },
  {
    id: "3",
    name: "Study Groups",
    avatar: "SG",
    color: "bg-purple-500",
    unread: 2,
    channels: [
      { id: "8", name: "math-study", type: "text", unread: 0 },
      { id: "9", name: "chemistry-help", type: "text", unread: 2 }
    ]
  }
];

const mockMessages = [
  {
    id: "1",
    author: "Dr. Smith",
    avatar: undefined,
    content: "Welcome to Physics 101! Please introduce yourselves and let me know what you're hoping to learn this semester.",
    timestamp: "Today at 9:15 AM",
    reactions: [{ emoji: "👋", count: 12 }, { emoji: "📚", count: 5 }]
  },
  {
    id: "2", 
    author: "Sarah Chen",
    avatar: undefined,
    content: "Hi everyone! I'm Sarah, a sophomore majoring in Engineering. Looking forward to diving deep into mechanics and thermodynamics!",
    timestamp: "Today at 9:18 AM",
    reactions: [{ emoji: "👋", count: 8 }]
  },
  {
    id: "3",
    author: "Alex Johnson", 
    avatar: undefined,
    content: "Hey! Alex here, I'm really excited about the lab experiments this semester. Has anyone started reading Chapter 1 yet?",
    timestamp: "Today at 9:22 AM",
    reactions: [{ emoji: "🧪", count: 3 }]
  },
  {
    id: "4",
    author: "Michael Rodriguez",
    avatar: undefined, 
    content: "Just finished Chapter 1! The conservation of energy section was fascinating. Looking forward to seeing how it applies in the labs.",
    timestamp: "Today at 10:45 AM",
    reactions: []
  }
];

const mockMembers = [
  { name: "Dr. Smith", role: "Teacher", status: "online", avatar: undefined },
  { name: "Sarah Chen", role: "Student", status: "online", avatar: undefined },
  { name: "Alex Johnson", role: "Student", status: "away", avatar: undefined },
  { name: "Michael Rodriguez", role: "Student", status: "online", avatar: undefined },
  { name: "Emma Wilson", role: "Student", status: "offline", avatar: undefined },
  { name: "David Kim", role: "Student", status: "online", avatar: undefined }
];

export default function ChatServer() {
  const params = useParams();
  const serverId = params.serverId as string;
  const [selectedChannel, setSelectedChannel] = useState("1");
  const [expandedGroups, setExpandedGroups] = useState(new Set(["channels", "voice"]));
  const [message, setMessage] = useState("");
  const [showMembers, setShowMembers] = useState(true);

  const getCurrentServer = () => {
    return mockServers.find(s => s.id === serverId);
  };

  const getSelectedChannel = () => {
    const server = getCurrentServer();
    if (!server) return null;
    return server.channels.find(c => c.id === selectedChannel);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "away": return "bg-yellow-500"; 
      case "offline": return "bg-gray-400";
      default: return "bg-gray-400";
    }
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const currentServer = getCurrentServer();
  const selectedChannelData = getSelectedChannel();

  // If server not found, show error
  if (!currentServer) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Server Not Found</h1>
          <p className="text-muted-foreground">
            The server with ID "{serverId}" does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex">
      {/* Channels Sidebar */}
      <div className="w-60 bg-card border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg truncate">{currentServer.name}</h2>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {/* Text Channels */}
            <div>
              <Button
                variant="ghost"
                className="w-full justify-start h-8 px-2 font-medium text-xs uppercase tracking-wide text-muted-foreground"
                onClick={() => toggleGroup("channels")}
              >
                {expandedGroups.has("channels") ? (
                  <ChevronDown className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 mr-1" />
                )}
                Text Channels
              </Button>
              
              {expandedGroups.has("channels") && (
                <div className="ml-2 space-y-1">
                  {currentServer.channels.filter(c => c.type === "text").map((channel) => (
                    <Button
                      key={channel.id}
                      variant={selectedChannel === channel.id ? "secondary" : "ghost"}
                      className="w-full justify-start h-7 px-2 text-sm"
                      onClick={() => setSelectedChannel(channel.id)}
                    >
                      <Hash className="h-3 w-3 mr-2" />
                      {channel.name}
                      {channel.unread > 0 && (
                        <Badge variant="destructive" className="ml-auto h-4 text-xs px-1">
                          {channel.unread}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Voice Channels */}
            <div>
              <Button
                variant="ghost"
                className="w-full justify-start h-8 px-2 font-medium text-xs uppercase tracking-wide text-muted-foreground"
                onClick={() => toggleGroup("voice")}
              >
                {expandedGroups.has("voice") ? (
                  <ChevronDown className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 mr-1" />
                )}
                Voice Channels
              </Button>
              
              {expandedGroups.has("voice") && (
                <div className="ml-2 space-y-1">
                  {currentServer.channels.filter(c => c.type === "voice").map((channel) => (
                    <Button
                      key={channel.id}
                      variant={selectedChannel === channel.id ? "secondary" : "ghost"}
                      className="w-full justify-start h-7 px-2 text-sm"
                      onClick={() => setSelectedChannel(channel.id)}
                    >
                      <Volume2 className="h-3 w-3 mr-2" />
                      {channel.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Channel Header */}
        <div className="h-12 border-b px-4 flex items-center justify-between bg-background">
          <div className="flex items-center space-x-2">
            {selectedChannelData?.type === "text" ? (
              <Hash className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Volume2 className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="font-semibold">
              {selectedChannelData?.name}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowMembers(!showMembers)}>
              <Users className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1">
          {/* Messages */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {mockMessages.map((msg) => (
                  <div key={msg.id} className="flex space-x-3 hover:bg-muted/50 p-2 rounded-md group">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.avatar} />
                      <AvatarFallback className="text-sm">
                        {msg.author.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{msg.author}</span>
                        <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      {msg.reactions.length > 0 && (
                        <div className="flex space-x-1 mt-2">
                          {msg.reactions.map((reaction, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs"
                            >
                              {reaction.emoji} {reaction.count}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Textarea
                    placeholder={`Message #${selectedChannelData?.name}`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[40px] max-h-32 resize-none pr-20"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (message.trim()) {
                          setMessage("");
                        }
                      }
                    }}
                  />
                  <div className="absolute right-2 bottom-2 flex space-x-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Smile className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-6 px-2"
                      disabled={!message.trim()}
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Members Sidebar */}
          {showMembers && (
            <>
              <Separator orientation="vertical" />
              <div className="w-60 bg-card">
                <div className="p-3 border-b">
                  <h3 className="font-medium text-sm">
                    Members — {mockMembers.length}
                  </h3>
                </div>
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1">
                    {mockMembers.map((member, idx) => (
                      <div key={idx} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                        <div className="relative">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


