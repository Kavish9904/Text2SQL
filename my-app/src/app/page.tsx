"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Grid2X2,
  X,
  Pencil,
  User,
  Play,
  Plus,
  Database,
  MessageSquare,
  ChevronRight,
  LogOut,
  History,
  Maximize2,
  Minimize2,
  Settings,
  Check,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DatabaseConnection } from "@/types/database";

export default function HomePage() {
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [isEditingWorkspace, setIsEditingWorkspace] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [queries, setQueries] = useState([{ id: 1, title: "Untitled Query" }]);
  const [queryContent, setQueryContent] = useState("");
  const [lineCount, setLineCount] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [queryExpanded, setQueryExpanded] = useState(false);
  const [resultsExpanded, setResultsExpanded] = useState(false);
  const [isAssistantVisible, setIsAssistantVisible] = useState(true);
  const [selectedDatabase, setSelectedDatabase] =
    useState<DatabaseConnection | null>(null);
  const [connectedDatabases, setConnectedDatabases] = useState<
    DatabaseConnection[]
  >([]);

  const workspaceInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication and update workspace name
    const auth = localStorage.getItem("isAuthenticated") === "true";
    setIsAuthenticated(auth);

    if (auth) {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}"
      );
      if (currentUser && currentUser.name) {
        setWorkspaceName(`${currentUser.name}'s Workspace`);
        setEditValue(workspaceName);
      } else {
        setWorkspaceName("User's Workspace");
        setEditValue("User's Workspace");
      }
    }
  }, [isAuthenticated]); // Add isAuthenticated as dependency

  // Update workspace name after login
  useEffect(() => {
    const handleStorageChange = () => {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}"
      );
      if (currentUser && currentUser.name) {
        setWorkspaceName(`${currentUser.name}'s Workspace`);
        setEditValue(workspaceName);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = localStorage.getItem("isAuthenticated") === "true";
      if (!isAuth) {
        router.push("/login");
      } else {
        setIsAuthenticated(true);
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
        setCurrentUser(user);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    // Load connected databases from localStorage
    const savedConnections = localStorage.getItem("databaseConnections");
    if (savedConnections) {
      const connections = JSON.parse(savedConnections);
      setConnectedDatabases(connections);
      // Set the first database as selected by default if available
      if (connections.length > 0 && !selectedDatabase) {
        setSelectedDatabase(connections[0]);
      }
    }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setQueryContent(content);
    const lines = content.split("\n").length;
    setLineCount(Math.max(1, lines));
  };

  const toggleQueryExpand = () => {
    setQueryExpanded(!queryExpanded);
    if (resultsExpanded) setResultsExpanded(false);
  };

  const toggleResultsExpand = () => {
    setResultsExpanded(!resultsExpanded);
    if (queryExpanded) setQueryExpanded(false);
  };

  // Handle workspace name edit
  const handleWorkspaceEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setWorkspaceName(editValue);
    setIsEditingWorkspace(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-gray-200 flex flex-col">
        {/* User Section */}
        <div className="p-4 border-b border-gray-200">
          {isEditingWorkspace ? (
            <form
              onSubmit={handleWorkspaceEdit}
              className="flex items-center gap-2"
            >
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-gray-100"
              >
                <Check className="h-4 w-4 text-gray-500" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-gray-100"
                onClick={() => {
                  setIsEditingWorkspace(false);
                  setEditValue(workspaceName);
                }}
              >
                <X className="h-4 w-4 text-gray-500" />
              </Button>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <h2 className="text-sm text-gray-900">
                  {workspaceName || "User's Workspace"}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsEditingWorkspace(true);
                  setEditValue(workspaceName);
                }}
                className="hover:bg-gray-100"
              >
                <Pencil className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          )}
        </div>

        {/* Connected Databases */}
        <div className="p-4 border-b border-gray-200">
          <Link
            href="/databases"
            className="flex items-center gap-2 text-gray-900"
          >
            <Database className="h-5 w-5 text-gray-600" />
            <span className="font-semibold">Connected Databases</span>
          </Link>
        </div>

        {/* Queries Section */}
        <div className="p-4 flex-1">
          <div className="text-sm text-gray-900 mb-3">QUERIES</div>
          <div className="mb-2 text-gray-900">Untitled Query</div>
          <button className="flex items-center gap-2 text-gray-900">
            <Plus className="h-4 w-4 text-gray-600" />
            <span>New Query</span>
          </button>
        </div>

        {/* Upgrade Button */}
        <div className="mt-auto p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full flex items-center gap-2 text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-md"
            onClick={() => router.push("/pricing")}
          >
            <Zap className="h-4 w-4 text-gray-500" />
            Upgrade to Pro
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="border-b border-gray-200 flex items-center justify-between h-14 bg-white z-10 relative">
          <div className="text-xl px-4 text-gray-900">T2SQL</div>
          <div className="flex items-center gap-4 absolute right-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAssistantVisible(true)}
              className="hover:bg-gray-100 rounded-full"
            >
              <MessageSquare className="h-5 w-5 text-gray-500" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-gray-900 text-white hover:bg-gray-800"
                >
                  {currentUser?.name?.[0]?.toUpperCase() || "U"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[200px] bg-white border border-gray-200 py-1"
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="text-sm text-gray-900 font-semibold">
                    My Account
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="h-[1px] bg-gray-100 my-1" />
                <DropdownMenuItem
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push("/profile")}
                >
                  <User className="h-4 w-4 text-gray-900" />
                  <div className="flex flex-col">
                    <div className="text-sm text-gray-900">
                      {currentUser?.name || "Guest"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {currentUser?.email || "No email"}
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="px-3 py-2 hover:bg-gray-50 text-sm text-gray-900 cursor-pointer flex items-center">
                  <Settings className="h-4 w-4 mr-2 text-gray-900" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="h-[1px] bg-gray-100 my-1" />
                <DropdownMenuItem
                  className="px-3 py-2 hover:bg-gray-50 text-sm text-red-600 cursor-pointer flex items-center"
                  onClick={() => {
                    localStorage.removeItem("isAuthenticated");
                    localStorage.removeItem("currentUser");
                    router.push("/login");
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2 text-red-600" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Query Section */}
        <div className={`flex-1 flex ${isAssistantVisible ? "" : "pr-0"}`}>
          <div className="flex-1 border-r border-gray-200">
            <div className="h-full flex flex-col">
              {/* Run Button and Database Selector */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button className="bg-black text-white hover:bg-gray-800 flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    RUN
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 text-gray-900"
                      >
                        <Database className="h-4 w-4 text-gray-600" />
                        {selectedDatabase?.name || "Select Database"}
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-[200px] bg-white border border-gray-200"
                    >
                      {connectedDatabases.length === 0 ? (
                        <DropdownMenuItem disabled className="text-gray-500">
                          No databases connected
                        </DropdownMenuItem>
                      ) : (
                        connectedDatabases.map((db) => (
                          <DropdownMenuItem
                            key={db.id}
                            onClick={() => setSelectedDatabase(db)}
                            className="flex items-center gap-2 text-gray-900 hover:bg-gray-100"
                          >
                            <Database className="h-4 w-4 text-gray-600" />
                            {db.name}
                          </DropdownMenuItem>
                        ))
                      )}
                      <DropdownMenuItem
                        className="flex items-center gap-2 border-t text-gray-900 hover:bg-gray-100"
                        onClick={() => router.push("/connect")}
                      >
                        <Plus className="h-4 w-4" />
                        Add New Database
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Query Editor */}
              <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex justify-between p-3 border-b border-gray-200">
                  <div className="text-gray-900 font-semibold tracking-wide">
                    Query Editor
                  </div>
                  <Maximize2 className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex h-[calc(100%-48px)]">
                  <div className="w-12 flex-none overflow-hidden relative border-r bg-white">
                    <div
                      ref={lineNumbersRef}
                      className="absolute w-full text-right pr-4 py-3 text-gray-400 select-none"
                      style={{ transform: `translateY(-${scrollPosition}px)` }}
                    >
                      {Array.from(
                        { length: Math.max(lineCount, 1) },
                        (_, i) => (
                          <div key={i + 1} className="leading-6 h-6">
                            {i + 1}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={queryContent}
                    onChange={handleQueryChange}
                    onScroll={(e) => {
                      const scrollTop = e.currentTarget.scrollTop;
                      setScrollPosition(scrollTop);
                      if (lineNumbersRef.current) {
                        lineNumbersRef.current.style.transform = `translateY(-${scrollTop}px)`;
                      }
                    }}
                    placeholder="Type your query here..."
                    className="flex-1 p-3 resize-none outline-none leading-6 overflow-y-auto text-gray-900 placeholder:text-gray-400"
                    style={{
                      lineHeight: "1.5rem",
                    }}
                  />
                </div>
              </div>

              {/* Results Section */}
              <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex justify-between p-3 border-b border-gray-200">
                  <div className="text-gray-900 font-semibold tracking-wide">
                    Results
                  </div>
                  <Maximize2 className="h-4 w-4 text-gray-600" />
                </div>
                <div className="p-4">
                  {/* Empty by default - will be populated when query runs */}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - AI Assistant */}
          {isAssistantVisible && (
            <div className="w-80 border-l border-gray-200 flex flex-col">
              {/* AI Assistant Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between relative">
                <Button variant="ghost" size="icon" className="absolute left-3">
                  <History className="h-4 w-4 text-gray-600" />
                </Button>
                <div className="flex-1 flex justify-center">
                  <span className="font-semibold tracking-wide text-gray-900">
                    Assistant
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsAssistantVisible(false)}
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              </div>

              {/* AI Assistant Content */}
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-gray-600" />
                </div>
                <h3 className="text-gray-900 mb-2">AI Assistant</h3>
                <p className="text-gray-600 text-sm mb-1">
                  The only limit are your Questions
                </p>
                <p className="text-gray-600 text-sm">Let's get started</p>
              </div>

              {/* AI Assistant Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="relative">
                  <Input
                    placeholder="Type your Questions..."
                    className="pr-10 text-gray-900 placeholder:text-gray-600"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
