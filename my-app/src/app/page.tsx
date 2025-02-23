"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Grid2X2,
  ChevronRight,
  Plus,
  X,
  Pencil,
  Check,
  User,
  Settings,
  LogOut,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function WelcomePage() {
  const [chats, setChats] = useState([{ id: 1, title: "Untitled Chat 1" }]);
  const [activeChat, setActiveChat] = useState(1);
  const [highestId, setHighestId] = useState(1);
  const [workspaceName, setWorkspaceName] = useState("Access's workspace");
  const [isEditingWorkspace, setIsEditingWorkspace] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const workspaceInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [connectedDatabases, setConnectedDatabases] = useState<number>(0);

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = localStorage.getItem("isAuthenticated") === "true";
      if (!isAuth) {
        router.push("/login");
      } else {
        setIsAuthenticated(true);
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
        setCurrentUser(user);
        setWorkspaceName(`${user.name}'s workspace`);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (chats.length === 0) {
      setHighestId(0);
    } else {
      setHighestId(Math.max(...chats.map((chat) => chat.id)));
    }
  }, [chats]);

  useEffect(() => {
    if (isEditingWorkspace && workspaceInputRef.current) {
      workspaceInputRef.current.focus();
    }
  }, [isEditingWorkspace]);

  useEffect(() => {
    // Get the connected databases count from localStorage
    const databases = JSON.parse(
      localStorage.getItem("connectedDatabases") || "[]"
    );
    setConnectedDatabases(databases.length);
  }, []);

  const handleNewChat = () => {
    const newId = highestId + 1;
    setHighestId(newId);
    const newChat = { id: newId, title: `Untitled Chat ${newId}` };
    setChats([...chats, newChat]);
    setActiveChat(newId);
  };

  const removeChat = (chatId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newChats = chats.filter((chat) => chat.id !== chatId);
    setChats(newChats);
    if (newChats.length === 0) {
      setActiveChat(0);
    } else if (activeChat === chatId) {
      setActiveChat(newChats[newChats.length - 1].id);
    }
  };

  const handleWorkspaceNameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setWorkspaceName(e.target.value);
  };

  const handleWorkspaceNameSubmit = () => {
    setIsEditingWorkspace(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
    router.push("/login");
  };

  if (!isAuthenticated) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-white text-black flex">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-gray-200 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 flex-grow">
            <div className="h-6 w-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex-shrink-0" />
            {isEditingWorkspace ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleWorkspaceNameSubmit();
                }}
                className="flex-grow"
              >
                <Input
                  ref={workspaceInputRef}
                  type="text"
                  value={workspaceName}
                  onChange={handleWorkspaceNameChange}
                  className="h-6 py-0 px-1 text-sm font-medium"
                  onBlur={handleWorkspaceNameSubmit}
                />
              </form>
            ) : (
              <span className="font-medium truncate">{workspaceName}</span>
            )}
          </div>
          <button
            className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"
            title={
              isEditingWorkspace ? "Save workspace name" : "Edit workspace name"
            }
            onClick={() => setIsEditingWorkspace(!isEditingWorkspace)}
          >
            {isEditingWorkspace ? <Check size={16} /> : <Pencil size={16} />}
          </button>
        </div>

        <div className="flex flex-col h-full">
          <nav className="space-y-4 flex-grow">
            <Link
              href="/databases"
              className="flex items-center justify-between px-3 py-2 text-gray-500 hover:text-black rounded-md hover:bg-gray-100 group"
            >
              <div className="flex items-center gap-3">
                <Grid2X2 size={20} />
                <span>Connected Databases</span>
              </div>
              {connectedDatabases > 0 && (
                <span className="text-xs text-gray-400 group-hover:text-gray-600">
                  {connectedDatabases}
                </span>
              )}
            </Link>

            <div className="border-t border-gray-200 my-2"></div>

            <div className="space-y-2">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Chats
              </h3>
              <nav className="space-y-2">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer group",
                      activeChat === chat.id ? "bg-gray-100" : ""
                    )}
                    onClick={() => setActiveChat(chat.id)}
                  >
                    <div>{chat.title}</div>
                    <button
                      onClick={(e) => removeChat(chat.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 p-1 rounded-full transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </nav>
              <Button
                variant="ghost"
                onClick={handleNewChat}
                className="hover:bg-gray-100 w-full justify-start text-gray-500 hover:text-black transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
          </nav>

          <div className="mt-auto p-4 border-t">
            <Button
              variant="ghost"
              className="w-full flex items-center gap-2 justify-start text-black hover:bg-gray-100 border border-gray-200 rounded-lg"
              onClick={() => router.push("/pricing")}
            >
              <Zap className="h-4 w-4" />
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <nav className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
          <div className="flex items-center">
            <span className="text-xl font-bold text-black">T2SQL</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                className="rounded-full bg-gray-900 text-white hover:bg-gray-700"
              >
                {currentUser?.name.charAt(0).toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <div className="px-2 py-1.5">
                <div className="text-sm font-semibold text-black">
                  My Account
                </div>
              </div>
              <DropdownMenuItem
                className="px-2 py-1.5 flex flex-col gap-1 cursor-pointer hover:bg-gray-100"
                onClick={() => router.push("/profile")}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-black" />
                  <div>
                    <div className="text-sm font-normal text-black">
                      {currentUser?.name}
                    </div>
                    <div className="text-xs text-black">
                      {currentUser?.email}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="px-2 py-1.5 text-sm cursor-pointer text-black">
                <Settings className="mr-2 h-4 w-4 text-black" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="px-2 py-1.5 text-sm cursor-pointer text-black"
                onSelect={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4 text-black" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {!activeChat && (
            <div className="max-w-2xl mx-auto mt-20 px-4">
              <h2 className="text-gray-500 text-xl mb-2">
                Hello {currentUser?.name}
              </h2>
              <h1 className="text-3xl font-semibold mb-8 text-black">
                Let&apos;s get started
              </h1>
              <Card
                className="hover:border-gray-300 cursor-pointer"
                onClick={() => router.push("/connect")}
              >
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Grid2X2 className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-black mb-1">
                        Connect your database
                      </h3>
                      <p className="text-sm text-gray-400">
                        Start asking questions and create charts from your data
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Card>
            </div>
          )}
          {chats.length > 0 && activeChat !== 0 && (
            <div className="max-w-2xl mx-auto mt-20">
              <h2 className="text-gray-500 text-xl mb-2">
                Hello {currentUser?.name}
              </h2>
              <h1 className="text-3xl font-semibold mb-8 text-black">
                Let&apos;s get started
              </h1>
              <Card
                className="hover:border-gray-300 cursor-pointer"
                onClick={() => router.push("/connect")}
              >
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Grid2X2 className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-black mb-1">
                        Connect your database
                      </h3>
                      <p className="text-sm text-gray-400">
                        Start asking questions and create charts from your data
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
