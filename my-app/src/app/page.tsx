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

type MessageType = {
  type: "user" | "bot";
  content: string;
  sql?: string; // Make sql optional
};

type ChatType = {
  id: string;
  title: string;
  messages: MessageType[];
};

export default function WelcomePage() {
  const [chats, setChats] = useState<ChatType[]>([
    {
      id: "1",
      title: "Untitled Chat",
      messages: [],
    },
  ]);
  const [activeChat, setActiveChat] = useState("1");
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
  const [userQuery, setUserQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<string>("psql");

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
    if (isEditingWorkspace && workspaceInputRef.current) {
      workspaceInputRef.current.focus();
    }
  }, [isEditingWorkspace]);

  useEffect(() => {
    // Check for database connection
    const checkConnection = () => {
      const databaseConnections = localStorage.getItem("databaseConnections");
      console.log("databaseConnections:", databaseConnections);

      if (databaseConnections) {
        const connections = JSON.parse(databaseConnections);
        if (connections.length > 0) {
          setConnectedDatabases(connections.length);
          console.log("Setting connected databases to", connections.length);
        } else {
          setConnectedDatabases(0);
          console.log("Setting connected databases to 0");
        }
      }
    };

    checkConnection();
    // Add event listener for storage changes
    window.addEventListener("storage", checkConnection);

    return () => {
      window.removeEventListener("storage", checkConnection);
    };
  }, []);

  const handleNewChat = () => {
    const newChat: ChatType = {
      id: Date.now().toString(),
      title: "Untitled Chat",
      messages: [],
    };

    setChats([...chats, newChat]);
    setActiveChat(newChat.id);
  };

  const removeChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newChats = chats.filter((chat) => chat.id !== chatId);
    setChats(newChats);
    if (newChats.length === 0) {
      setActiveChat("0");
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

  const generateChatTitle = (message: string): string => {
    const cleanMessage = message.trim().toLowerCase();

    // Greetings should be "General Chat"
    if (cleanMessage.match(/^(hi|hello|hey|greetings)/)) {
      return "General Chat";
    }

    // Database queries
    if (
      cleanMessage.includes("select") ||
      cleanMessage.includes("show") ||
      cleanMessage.includes("list")
    ) {
      return "Data Query";
    }
    if (cleanMessage.includes("create") || cleanMessage.includes("make")) {
      return "Create Query";
    }
    if (cleanMessage.includes("update") || cleanMessage.includes("modify")) {
      return "Update Query";
    }
    if (cleanMessage.includes("delete") || cleanMessage.includes("remove")) {
      return "Delete Query";
    }
    if (cleanMessage.includes("chart") || cleanMessage.includes("graph")) {
      return "Data Visualization";
    }

    // If message is short and meaningful, use it
    if (cleanMessage.length <= 15 && !cleanMessage.includes("?")) {
      return message.charAt(0).toUpperCase() + cleanMessage.slice(1);
    }

    // Default to "New Query"
    return "New Query";
  };

  const handleSendQuery = async () => {
    if (!userQuery.trim()) return;

    setIsLoading(true);
    const newUserMessage = { type: "user" as const, content: userQuery };

    // Update chat title if this is the first message
    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === activeChat) {
          const updatedMessages = [...chat.messages, newUserMessage];
          const newTitle =
            updatedMessages.length === 1
              ? generateChatTitle(userQuery)
              : chat.title;
          return { ...chat, title: newTitle, messages: updatedMessages };
        }
        return chat;
      })
    );

    try {
      const connections = JSON.parse(
        localStorage.getItem("databaseConnections") || "[]"
      );
      if (!connections.length) {
        throw new Error(
          "No database connection found. Please connect to a database first."
        );
      }

      const currentDB = connections[0];
      const response = await fetch("http://localhost:8000/api/v1/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userQuery,
          database: currentDB.database,
          host: currentDB.host,
          port: currentDB.port,
          username: currentDB.username,
          password: currentDB.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || "Failed to get response from database"
        );
      }

      const data = await response.json();
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChat
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  { type: "bot" as const, content: data.response },
                ],
              }
            : chat
        )
      );
    } catch (error) {
      // Show error as bot message
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChat
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    type: "bot" as const,
                    content: `Error: ${
                      error instanceof Error
                        ? error.message
                        : "Connection failed. Please check your database connection and firewall rules."
                    }`,
                  },
                ],
              }
            : chat
        )
      );
    } finally {
      setIsLoading(false);
      setUserQuery("");
    }
  };

  const getCurrentChat = () => {
    return chats.find((chat) => chat.id === activeChat);
  };

  const handleDatabaseChange = (dbName: string) => {
    setSelectedDatabase(dbName);
  };

  if (!isAuthenticated) {
    return null; // or a loading spinner
  }

  console.log("Current connectedDatabases state:", connectedDatabases);

  console.log("Rendering with connectedDatabases:", connectedDatabases);

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
          {connectedDatabases === 0 ? (
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
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-auto p-8">
                {!activeChat ||
                (activeChat && getCurrentChat()?.messages.length === 0) ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                      <h2 className="text-gray-500 text-xl mb-2">
                        Hello {currentUser?.name}
                      </h2>
                      <h1 className="text-3xl sm:text-4xl font-semibold">
                        What would you like to explore today?
                      </h1>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto space-y-4">
                    {/* Chat Messages Container - only this part scrolls */}
                    <div className="h-[calc(100vh-200px)] overflow-y-auto">
                      {getCurrentChat()?.messages.map((message, index) => (
                        <div key={index} className="space-y-2 p-2">
                          {message.type === "user" ? (
                            <div className="bg-gray-100 rounded-lg p-4">
                              <div className="text-sm text-gray-500 mb-1">
                                You asked:
                              </div>
                              <div className="text-gray-900">
                                {message.content}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-blue-50 rounded-lg p-4">
                              <div className="text-sm text-gray-500 mb-1">
                                Response:
                              </div>
                              <div className="text-gray-900 whitespace-pre-wrap">
                                {message.content}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 p-4">
                <div className="max-w-3xl mx-auto">
                  <div className="relative">
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="database"
                            className="flex-shrink-0 w-32"
                          >
                            <div className="flex items-center gap-2">
                              <Grid2X2 className="h-4 w-4" />
                              <span>{selectedDatabase}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-32">
    {JSON.parse(
      localStorage.getItem("databaseConnections") || "[]"
    ).map((db: { id: string; name: string }) => (
      <DropdownMenuItem
        key={db.id}
        onClick={() => handleDatabaseChange(db.name)}
        className="cursor-pointer text-black hover:bg-gray-100"
      >
        {db.name}
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
                      </DropdownMenu>
                      <div className="flex-grow relative">
                        <Input
                          className="w-full pr-24 py-6 text-base"
                          placeholder="Ask a question or create a chart..."
                          value={userQuery}
                          onChange={(e) => setUserQuery(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendQuery();
                            }
                          }}
                        />
                        <Button
                          variant="default"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={handleSendQuery}
                          disabled={isLoading}
                        >
                          {isLoading ? "Sending..." : "Send"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
