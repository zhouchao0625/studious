"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, X, Users, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateConversation: (type: 'DM' | 'GROUP', memberUsernames: string[], name?: string) => void;
  availableUsers: never[]; // Not used anymore for privacy
  isLoading?: boolean;
}

export function CreateConversationModal({
  open,
  onOpenChange,
  onCreateConversation,
  availableUsers,
  isLoading = false,
}: CreateConversationModalProps) {
  const [usernameInput, setUsernameInput] = useState("");
  const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [activeTab, setActiveTab] = useState<"dm" | "group">("dm");

  const addUsername = () => {
    const trimmedUsername = usernameInput.trim();
    if (trimmedUsername && !selectedUsernames.includes(trimmedUsername)) {
      if (activeTab === "dm") {
        setSelectedUsernames([trimmedUsername]);
      } else {
        setSelectedUsernames(prev => [...prev, trimmedUsername]);
      }
      setUsernameInput("");
    }
  };

  const removeUsername = (username: string) => {
    setSelectedUsernames(prev => prev.filter(u => u !== username));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addUsername();
    }
  };

  const handleCreate = () => {
    if (activeTab === "dm" && selectedUsernames.length === 1) {
      onCreateConversation("DM", selectedUsernames);
    } else if (activeTab === "group" && selectedUsernames.length >= 1 && groupName.trim()) {
      onCreateConversation("GROUP", selectedUsernames, groupName.trim());
    }
    
    // Reset form
    setSelectedUsernames([]);
    setGroupName("");
    setUsernameInput("");
    setActiveTab("dm");
  };

  const handleClose = () => {
    setSelectedUsernames([]);
    setGroupName("");
    setUsernameInput("");
    setActiveTab("dm");
    onOpenChange(false);
  };

  const canCreate = activeTab === "dm" 
    ? selectedUsernames.length === 1
    : selectedUsernames.length >= 1 && groupName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a conversation</DialogTitle>
          <DialogDescription>
            Create a direct message or group conversation
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "dm" | "group")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dm" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Direct Message
            </TabsTrigger>
            <TabsTrigger value="group" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Group Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dm" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dm-username">Enter username to message</Label>
              <div className="flex space-x-2">
                <Input
                  id="dm-username"
                  placeholder="Enter username..."
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button 
                  type="button" 
                  onClick={addUsername}
                  disabled={!usernameInput.trim()}
                >
                  Add
                </Button>
              </div>
            </div>

            {selectedUsernames.length > 0 && (
              <div className="space-y-2">
                <Label>Selected user:</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedUsernames.map(username => (
                    <Badge
                      key={username}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1"
                    >
                      @{username}
                      <button
                        onClick={() => removeUsername(username)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="group" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group name</Label>
              <Input
                id="group-name"
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-username">Add members by username</Label>
              <div className="flex space-x-2">
                <Input
                  id="group-username"
                  placeholder="Enter username..."
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button 
                  type="button" 
                  onClick={addUsername}
                  disabled={!usernameInput.trim()}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Selected users */}
            {selectedUsernames.length > 0 && (
              <div className="space-y-2">
                <Label>Selected members ({selectedUsernames.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedUsernames.map(username => (
                    <Badge
                      key={username}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1"
                    >
                      @{username}
                      <button
                        onClick={() => removeUsername(username)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!canCreate || isLoading}
          >
            {isLoading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
