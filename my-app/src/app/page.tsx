"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import debounce from "lodash/debounce";
import {
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
  Settings,
  Check,
  Zap,
  BarChart2,
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  DatabaseConnection,
  SQLConnection,
  MotherDuckConnection,
  TurboDBConnection,
  CloudflareConnection,
} from "@/types/database";
import { toast } from "react-hot-toast";
import { TableSuggestions } from "@/components/ui/table-suggestions";
import { CommandSuggestions } from "@/components/ui/command-suggestions";
import { ChartView } from "@/components/ui/chart-view";
import { apiUrl } from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatSession = {
  id: string;
  messages: Message[];
  createdAt: Date;
  title: string;
};

type Query = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  results: Record<string, TableCellValue>[] | null;
};

// Add type for table cell values
type TableCellValue = string | number | boolean | null;

// Add new types
type TableMetadata = {
  name: string;
  columns: Array<{
    name: string;
    type: string;
  }>;
};

type ChartType = "line" | "bar" | "pie";

export default function HomePage() {
  const [workspaceTitle, setWorkspaceTitle] = useState("");
  const [isEditingWorkspace, setIsEditingWorkspace] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [queries, setQueries] = useState<Query[]>([]);
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);
  const [queryContent, setQueryContent] = useState("");
  const [lineCount, setLineCount] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isAssistantVisible, setIsAssistantVisible] = useState(true);
  const [selectedDatabase, setSelectedDatabase] =
    useState<DatabaseConnection | null>(null);
  const [connectedDatabases, setConnectedDatabases] = useState<
    DatabaseConnection[]
  >([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [queryResults, setQueryResults] = useState<
    Record<string, TableCellValue>[] | null
  >(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(false);
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [chartConfig, setChartConfig] = useState<{
    xAxis: string;
    yAxis: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: Date.now().toString(),
      messages: [],
      createdAt: new Date(),
      title: "New Chat",
    },
  ]);
  const [currentChatId, setCurrentChatId] = useState<string>(
    () => chatSessions[0].id
  );

  // Add new state for table suggestions
  const [tableMetadata, setTableMetadata] = useState<TableMetadata[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Add new state for command suggestions
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  const commandSuggestionsRef = useRef<HTMLDivElement>(null);

  // Add debounced search
  const debouncedSetShowSuggestions = useCallback(
    debounce((value: boolean) => {
      setShowSuggestions(value);
    }, 300),
    []
  );

  // Add new state for assistant width
  const [assistantWidth, setAssistantWidth] = useState(320); // default width 320px
  const [isDragging, setIsDragging] = useState(false);

  // Add resize handler functions
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const windowWidth = window.innerWidth;
        const newWidth = windowWidth - e.clientX;
        // Limit the width between 280px and 600px
        setAssistantWidth(Math.min(Math.max(280, newWidth), 600));
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated") === "true";
    setIsAuthenticated(auth);

    if (auth) {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}"
      );
      if (currentUser && currentUser.name) {
        const savedWorkspaceTitle = localStorage.getItem("workspaceTitle");
        if (savedWorkspaceTitle) {
          setWorkspaceTitle(savedWorkspaceTitle);
          setEditValue(savedWorkspaceTitle);
        } else {
          const defaultTitle = `${currentUser.name}'s Workspace`;
          setWorkspaceTitle(defaultTitle);
          setEditValue(defaultTitle);
          localStorage.setItem("workspaceTitle", defaultTitle);
        }
      } else {
        const defaultTitle = "User's Workspace";
        setWorkspaceTitle(defaultTitle);
        setEditValue(defaultTitle);
        localStorage.setItem("workspaceTitle", defaultTitle);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleStorageChange = () => {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}"
      );
      if (currentUser && currentUser.name) {
        setWorkspaceTitle(`${currentUser.name}'s Workspace`);
        setEditValue(workspaceTitle);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [workspaceTitle]);

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
    const savedConnections = localStorage.getItem("databaseConnections");
    if (savedConnections) {
      const connections = JSON.parse(savedConnections);
      setConnectedDatabases(connections);
      if (connections.length > 0 && !selectedDatabase) {
        setSelectedDatabase(connections[0]);
      }
    }
  }, [selectedDatabase]);

  useEffect(() => {
    // Load chat history when component mounts
    const loadChatHistory = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/v1/chats`);
        if (!response.ok) {
          throw new Error("Failed to load chat history");
        }
        const chats = await response.json();

        if (chats.length > 0) {
          // Convert ISO date strings to Date objects and ensure proper typing
          const formattedChats = chats.map(
            (chat: {
              id: string;
              messages: Message[];
              createdAt: string;
              title: string;
            }) => ({
              ...chat,
              createdAt: new Date(chat.createdAt),
              messages: chat.messages || [], // Ensure messages is always an array
            })
          );

          setChatSessions(formattedChats);
          setCurrentChatId(formattedChats[0].id);
          setMessages(formattedChats[0].messages);
        } else {
          // Create initial chat if no history exists
          const initialChat: ChatSession = {
            id: Date.now().toString(),
            messages: [],
            createdAt: new Date(),
            title: "New Chat",
          };
          setChatSessions([initialChat]);
          setCurrentChatId(initialChat.id);
          setMessages([]);
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
        toast.error("Failed to load chat history");
      }
    };

    if (isAuthenticated) {
      loadChatHistory();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedDatabase) {
      const fetchMetadata = async () => {
        try {
          console.log("Fetching metadata for database:", selectedDatabase.name);
          const response = await fetch(`${apiUrl}/api/v1/metadata`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(
              selectedDatabase.type === "mysql" ||
                selectedDatabase.type === "postgresql" ||
                selectedDatabase.type === "clickhouse"
                ? {
                    host: (selectedDatabase as SQLConnection).host,
                    port: (selectedDatabase as SQLConnection).port,
                    database: (selectedDatabase as SQLConnection).database,
                    username: (selectedDatabase as SQLConnection).username,
                    password: (selectedDatabase as SQLConnection).password,
                  }
                : selectedDatabase.type === "motherduck"
                ? {
                    database: (selectedDatabase as MotherDuckConnection)
                      .database,
                    token: (selectedDatabase as MotherDuckConnection).token,
                  }
                : selectedDatabase.type === "turbodb"
                ? {
                    database: (selectedDatabase as TurboDBConnection).database,
                    apiKey: (selectedDatabase as TurboDBConnection).apiKey,
                    organization: (selectedDatabase as TurboDBConnection)
                      .organization,
                  }
                : {
                    accountId: (selectedDatabase as CloudflareConnection)
                      .accountId,
                    apiToken: (selectedDatabase as CloudflareConnection)
                      .apiToken,
                    databaseId: (selectedDatabase as CloudflareConnection)
                      .databaseId,
                  }
            ),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Metadata fetch failed:", response.status, errorText);
            throw new Error(
              `Failed to fetch metadata: ${response.status} - ${errorText}`
            );
          }

          interface DatabaseMetadata {
            [key: string]: Array<[string, string]>;
          }

          const data: DatabaseMetadata = await response.json();
          console.log("Raw metadata response:", data);

          const formattedMetadata = Object.entries(data).map(
            ([tableName, columns]) => ({
              name: tableName,
              columns: columns.map(([name, type]) => ({ name, type })),
            })
          );
          console.log("Formatted metadata:", formattedMetadata);
          setTableMetadata(formattedMetadata);
        } catch (error) {
          console.error("Error fetching metadata:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          toast.error(`Failed to fetch database metadata: ${errorMessage}`);
        }
      };

      fetchMetadata();
    }
  }, [selectedDatabase]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setQueryContent(content);
    const lines = content.split("\n").length;
    setLineCount(Math.max(1, lines));
  };

  const handleWorkspaceEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTitle = editValue.trim();
    if (newTitle) {
      setWorkspaceTitle(newTitle);
      localStorage.setItem("workspaceTitle", newTitle);
      setIsEditingWorkspace(false);
    }
  };

  const generateQueryTitle = (query: string): string => {
    const queryLower = query.toLowerCase().trim();

    // Inventory related queries
    if (queryLower.includes("inventory") || queryLower.includes("stock")) {
      if (queryLower.includes("sum") || queryLower.includes("total")) {
        if (queryLower.includes("value")) return "Inventory Total Value";
        if (queryLower.includes("quantity")) return "Inventory Total Quantity";
        return "Inventory Sum";
      }
      if (queryLower.includes("count")) return "Inventory Count";
      if (queryLower.includes("low") || queryLower.includes("< "))
        return "Low Stock Items";
      if (queryLower.includes("expired")) return "Expired Inventory";
      return "Inventory Query";
    }

    // Sales related queries
    if (queryLower.includes("sales")) {
      if (queryLower.includes("monthly")) return "Monthly Sales Report";
      if (queryLower.includes("daily")) return "Daily Sales Report";
      if (queryLower.includes("annual")) return "Annual Sales";
      if (queryLower.includes("top")) return "Top Sales";
      return "Sales Query";
    }

    // Customer related queries
    if (queryLower.includes("customer")) {
      if (queryLower.includes("order")) return "Customer Orders";
      if (queryLower.includes("top")) return "Top Customers";
      if (queryLower.includes("new")) return "New Customers";
      return "Customer Query";
    }

    // Product related queries
    if (queryLower.includes("product")) {
      if (queryLower.includes("price")) return "Product Prices";
      if (queryLower.includes("category")) return "Product Categories";
      if (queryLower.includes("top")) return "Top Products";
      return "Product Query";
    }

    // Order related queries
    if (queryLower.includes("order")) {
      if (queryLower.includes("recent")) return "Recent Orders";
      if (queryLower.includes("pending")) return "Pending Orders";
      if (queryLower.includes("status")) return "Order Status";
      return "Order Query";
    }

    // Try to generate title from SQL structure
    const actionMatch = queryLower.match(
      /(select|update|insert|delete)\s+(\w+)/i
    );
    if (actionMatch) {
      const action =
        actionMatch[1].charAt(0).toUpperCase() + actionMatch[1].slice(1);
      const target =
        actionMatch[2].charAt(0).toUpperCase() + actionMatch[2].slice(1);
      return `${action} ${target}`;
    }

    // Default to truncated query
    const firstLine = query.split("\n")[0].slice(0, 30);
    return firstLine + (firstLine.length >= 30 ? "..." : "");
  };

  const createNewChat = async () => {
    try {
      const newChatId = crypto.randomUUID();
      const newChat = {
        id: newChatId,
        messages: [],
        createdAt: new Date().toISOString(),
        title: "New Chat",
      };

      // Save new chat to backend
      const response = await fetch(`${apiUrl}/api/v1/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newChat),
      });

      if (!response.ok) {
        throw new Error("Failed to create new chat");
      }

      // Add new chat to state at the beginning of the list
      setChatSessions((prev) => [
        {
          ...newChat,
          createdAt: new Date(newChat.createdAt),
        },
        ...prev,
      ]);

      // Switch to new chat
      setCurrentChatId(newChatId);
      setMessages([]);
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast.error("Failed to create new chat");
    }
  };

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputMessage.trim()) return;

      try {
        const newMessage: Message = {
          role: "user",
          content: inputMessage,
        };

        // Find current chat session
        const currentSession = chatSessions.find((s) => s.id === currentChatId);
        if (!currentSession) return;

        // Create updated messages array
        const updatedMessages = [...currentSession.messages, newMessage];

        // Generate title from first message if this is the first user message
        const updatedTitle =
          currentSession.messages.length === 0
            ? inputMessage.slice(0, 30) +
              (inputMessage.length > 30 ? "..." : "")
            : currentSession.title;

        // Create updated chat data
        const updatedChat = {
          ...currentSession,
          messages: updatedMessages,
          title: updatedTitle,
          createdAt: currentSession.createdAt.toISOString(),
        };

        // Update messages state
        setMessages(updatedMessages);
        setInputMessage("");

        // Update chat sessions state with new title
        setChatSessions((prev) =>
          prev.map((session) =>
            session.id === currentChatId
              ? {
                  ...updatedChat,
                  createdAt: new Date(updatedChat.createdAt),
                }
              : session
          )
        );

        // Save updated chat to backend
        await fetch(`${apiUrl}/api/v1/chats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedChat),
        });

        // Extract table references from the message
        const tableRefs =
          inputMessage.match(/@(\w+)(?:\.(\w+))?/g)?.map((ref) => {
            const [table, column] = ref.slice(1).split(".");
            return { table, column };
          }) || [];

        // Get assistant response with metadata
        const response = await fetch(`${apiUrl}/api/v1/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: inputMessage,
            history: updatedMessages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            metadata: {
              tables: tableRefs.map((ref) => ({
                name: ref.table,
                columns: ref.column
                  ? [ref.column]
                  : tableMetadata
                      .find((t) => t.name === ref.table)
                      ?.columns.map((c) => c.name) || [],
              })),
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to send message: ${response.status} - ${errorText}`
          );
        }

        const data = await response.json();
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
        };

        // Update messages with assistant's response
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);

        // Update chat session with assistant's response
        const finalUpdatedChat = {
          ...updatedChat,
          messages: finalMessages,
        };

        // Save final updated chat to backend
        await fetch(`${apiUrl}/api/v1/chats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(finalUpdatedChat),
        });

        // Update chat sessions state
        setChatSessions((prev) =>
          prev.map((session) =>
            session.id === currentChatId
              ? {
                  ...finalUpdatedChat,
                  createdAt: new Date(finalUpdatedChat.createdAt),
                }
              : session
          )
        );
      } catch (error: unknown) {
        console.error("Full error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        toast.error(errorMessage);
      }
    },
    [
      inputMessage,
      chatSessions,
      currentChatId,
      tableMetadata,
      setMessages,
      setInputMessage,
      setChatSessions,
    ]
  );

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  useEffect(() => {
    const currentSession = chatSessions.find(
      (session) => session.id === currentChatId
    );
    if (currentSession) {
      setMessages(currentSession.messages);
    }
  }, [currentChatId, chatSessions]);

  const renderAssistantContent = () => {
    if (messages.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="h-6 w-6 text-gray-600" />
          </div>
          <h3 className="text-gray-900 mb-2">AI Assistant</h3>
          <p className="text-gray-600 text-sm mb-1">
            The only limit is your Questions
          </p>
          <p className="text-gray-600 text-sm">Let&apos;s get started</p>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-180px)]">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] break-words p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  // Update handleInputChange
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const cursorPosition = e.target.selectionStart || 0;
      setInputMessage(value);

      // Check for @ symbol
      const lastAtIndex = value.lastIndexOf("@", cursorPosition);
      const nextSpaceIndex = value.indexOf(" ", lastAtIndex);
      const isTypingAfterAt =
        lastAtIndex !== -1 &&
        (nextSpaceIndex === -1 || cursorPosition <= nextSpaceIndex);

      // Check for / symbol
      const lastSlashIndex = value.lastIndexOf("/", cursorPosition);
      const nextSpaceAfterSlash = value.indexOf(" ", lastSlashIndex);
      const isTypingAfterSlash =
        lastSlashIndex !== -1 &&
        (nextSpaceAfterSlash === -1 || cursorPosition <= nextSpaceAfterSlash);

      if (isTypingAfterAt) {
        const rect = e.target.getBoundingClientRect();
        const textBeforeCursor = value.substring(0, cursorPosition);

        // Create temporary span for width calculation
        const tempSpan = document.createElement("span");
        tempSpan.style.cssText = getComputedStyle(e.target).cssText;
        tempSpan.style.visibility = "hidden";
        tempSpan.style.position = "absolute";
        tempSpan.style.whiteSpace = "pre";
        tempSpan.textContent = textBeforeCursor;
        document.body.appendChild(tempSpan);

        // Calculate position
        const textWidth = tempSpan.offsetWidth;
        document.body.removeChild(tempSpan);

        // Calculate left position relative to input
        const inputPadding =
          parseInt(getComputedStyle(e.target).paddingLeft) || 0;
        const suggestionsLeft = Math.min(
          rect.left + inputPadding + textWidth,
          rect.right - 300 // Ensure suggestions don't go off-screen
        );

        setCursorPosition({
          top: rect.bottom + window.scrollY,
          left: suggestionsLeft,
        });

        setShowSuggestions(true);
        setShowCommandSuggestions(false);
      } else if (isTypingAfterSlash) {
        const rect = e.target.getBoundingClientRect();
        const textBeforeCursor = value.substring(0, cursorPosition);

        // Create temporary span for width calculation
        const tempSpan = document.createElement("span");
        tempSpan.style.cssText = getComputedStyle(e.target).cssText;
        tempSpan.style.visibility = "hidden";
        tempSpan.style.position = "absolute";
        tempSpan.style.whiteSpace = "pre";
        tempSpan.textContent = textBeforeCursor;
        document.body.appendChild(tempSpan);

        // Calculate position
        const textWidth = tempSpan.offsetWidth;
        document.body.removeChild(tempSpan);

        // Calculate left position relative to input
        const inputPadding =
          parseInt(getComputedStyle(e.target).paddingLeft) || 0;
        const suggestionsLeft = Math.min(
          rect.left + inputPadding + textWidth,
          rect.right - 300 // Ensure suggestions don't go off-screen
        );

        setCursorPosition({
          top: rect.bottom + window.scrollY,
          left: suggestionsLeft,
        });

        setShowCommandSuggestions(true);
        setShowSuggestions(false);
      } else {
        setShowSuggestions(false);
        setShowCommandSuggestions(false);
      }
    },
    []
  );

  // Add command suggestion handler
  const handleCommandSelect = useCallback(
    (command: string) => {
      const currentValue = inputMessage;
      const cursorPos = inputRef.current?.selectionStart || 0;
      const lastSlashBeforeCursor = currentValue.lastIndexOf(
        "/",
        cursorPos - 1
      );

      if (lastSlashBeforeCursor !== -1) {
        // Find the end of the current command (next space or end of string)
        const nextSpace = currentValue.indexOf(" ", lastSlashBeforeCursor);
        const endPos = nextSpace === -1 ? currentValue.length : nextSpace;

        // Replace the current command with the selected command
        const newValue =
          currentValue.substring(0, lastSlashBeforeCursor) +
          command +
          " " +
          currentValue.substring(endPos).trimLeft();

        setInputMessage(newValue);

        // Focus and move cursor after the inserted command
        if (inputRef.current) {
          const newCursorPos = lastSlashBeforeCursor + command.length + 1; // +1 for space
          inputRef.current.focus();
          requestAnimationFrame(() => {
            if (inputRef.current) {
              inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
          });
        }
      }

      setShowCommandSuggestions(false);
    },
    [inputMessage]
  );

  // Optimize suggestion selection
  const handleSuggestionSelect = useCallback(
    (value: string) => {
      const currentValue = inputMessage;
      const cursorPos = inputRef.current?.selectionStart || 0;
      const lastAtBeforeCursor = currentValue.lastIndexOf("@", cursorPos - 1);

      if (lastAtBeforeCursor !== -1) {
        // Find the end of the current suggestion (next space or end of string)
        const nextSpace = currentValue.indexOf(" ", lastAtBeforeCursor);
        const endPos = nextSpace === -1 ? currentValue.length : nextSpace;

        // Replace the current suggestion with the selected value
        const newValue =
          currentValue.substring(0, lastAtBeforeCursor) +
          "@" +
          value +
          " " +
          currentValue.substring(endPos).trimLeft();

        setInputMessage(newValue);

        // Focus and move cursor after the inserted suggestion
        if (inputRef.current) {
          const newCursorPos = lastAtBeforeCursor + value.length + 2; // +2 for @ and space
          inputRef.current.focus();
          requestAnimationFrame(() => {
            if (inputRef.current) {
              inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
          });
        }
      }

      setShowSuggestions(false);
    },
    [inputMessage]
  );

  // Update renderAssistantInput
  const renderAssistantInput = useCallback(
    () => (
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="relative">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={handleInputChange}
            placeholder="@ for objects or / for commands"
            className="pr-10 text-gray-900 placeholder:text-gray-600"
            disabled={isLoading || !selectedDatabase}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setShowSuggestions(false);
                setShowCommandSuggestions(false);
              }
            }}
            onClick={(e) => {
              const value = (e.target as HTMLInputElement).value;
              const lastAtIndex = value.lastIndexOf("@");
              const lastSlashIndex = value.lastIndexOf("/");
              if (lastAtIndex !== -1) {
                debouncedSetShowSuggestions(true);
              } else if (lastSlashIndex !== -1) {
                setShowCommandSuggestions(true);
              }
            }}
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400"
            disabled={isLoading || !selectedDatabase}
          >
            {isLoading ? (
              <div className="animate-spin">⌛</div>
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          {tableMetadata && tableMetadata.length > 0 && (
            <TableSuggestions
              isOpen={showSuggestions}
              onClose={() => setShowSuggestions(false)}
              tables={tableMetadata}
              onSelect={handleSuggestionSelect}
              triggerRef={suggestionsRef as React.RefObject<HTMLElement>}
            />
          )}
          <CommandSuggestions
            isOpen={showCommandSuggestions}
            onClose={() => setShowCommandSuggestions(false)}
            onSelect={handleCommandSelect}
            triggerRef={commandSuggestionsRef as React.RefObject<HTMLElement>}
          />
          <div
            ref={suggestionsRef}
            style={{
              position: "fixed",
              top: `${cursorPosition.top}px`,
              left: `${cursorPosition.left}px`,
              zIndex: 1000,
            }}
          />
          <div
            ref={commandSuggestionsRef}
            style={{
              position: "fixed",
              top: `${cursorPosition.top}px`,
              left: `${cursorPosition.left}px`,
              zIndex: 1000,
            }}
          />
        </form>
      </div>
    ),
    [
      inputMessage,
      isLoading,
      selectedDatabase,
      showSuggestions,
      showCommandSuggestions,
      tableMetadata,
      cursorPosition,
      handleInputChange,
      handleSendMessage,
      handleSuggestionSelect,
      handleCommandSelect,
      debouncedSetShowSuggestions,
    ]
  );

  const deleteChat = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      // Delete chat from backend
      const response = await fetch(`${apiUrl}/api/v1/chats/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      setChatSessions((prev) =>
        prev.filter((session) => session.id !== sessionId)
      );

      if (sessionId === currentChatId) {
        const remainingChats = chatSessions.filter(
          (session) => session.id !== sessionId
        );
        if (remainingChats.length > 0) {
          setCurrentChatId(remainingChats[0].id);
          setMessages(remainingChats[0].messages);
        } else {
          createNewChat();
        }
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    }
  };

  const handleQueryRun = async () => {
    if (!queryContent.trim() || !selectedDatabase) {
      setQueryError("Please enter a query and select a database");
      return;
    }

    setQueryError(null);
    setQueryResults(null);
    setIsLoading(true);

    try {
      const payload =
        selectedDatabase.type === "mysql" ||
        selectedDatabase.type === "postgresql" ||
        selectedDatabase.type === "clickhouse"
          ? {
              query: queryContent,
              database: (selectedDatabase as SQLConnection).database,
              host: (selectedDatabase as SQLConnection).host,
              port: (selectedDatabase as SQLConnection).port,
              username: (selectedDatabase as SQLConnection).username,
              password: (selectedDatabase as SQLConnection).password,
            }
          : selectedDatabase.type === "motherduck"
          ? {
              query: queryContent,
              database: (selectedDatabase as MotherDuckConnection).database,
              token: (selectedDatabase as MotherDuckConnection).token,
            }
          : selectedDatabase.type === "turbodb"
          ? {
              query: queryContent,
              database: (selectedDatabase as TurboDBConnection).database,
              apiKey: (selectedDatabase as TurboDBConnection).apiKey,
              organization: (selectedDatabase as TurboDBConnection)
                .organization,
            }
          : {
              query: queryContent,
              accountId: (selectedDatabase as CloudflareConnection).accountId,
              apiToken: (selectedDatabase as CloudflareConnection).apiToken,
              databaseId: (selectedDatabase as CloudflareConnection).databaseId,
            };

      const response = await fetch(`${apiUrl}/api/v1/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.data) {
        setQueryResults(data.data);

        const queryTitle = generateQueryTitle(queryContent);

        const newQuery: Query = {
          id: Date.now().toString(),
          title: queryTitle,
          content: queryContent,
          createdAt: new Date(),
          results: data.data,
        };

        setQueries((prev) => [...prev, newQuery]);
        setActiveQueryId(newQuery.id);
      } else {
        setQueryError("No results returned");
      }
    } catch (error) {
      console.error("Error executing query:", error);
      setQueryError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const createNewQuery = () => {
    const newQuery: Query = {
      id: Date.now().toString(),
      title: "New Query",
      content: "",
      createdAt: new Date(),
      results: null,
    };

    setQueries((prev) => [...prev, newQuery]);
    setActiveQueryId(newQuery.id);
    setQueryContent("");
    setQueryResults(null);
    setQueryError(null);
  };

  const loadQuery = (queryId: string) => {
    const query = queries.find((q) => q.id === queryId);
    if (query) {
      setActiveQueryId(query.id);
      setQueryContent(query.content);
      setQueryResults(query.results);
      setQueryError(null);
    }
  };

  const deleteQuery = (queryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQueries((prev) => prev.filter((query) => query.id !== queryId));

    if (queryId === activeQueryId) {
      setActiveQueryId(null);
      setQueryContent("");
    }
  };

  const switchChat = async (sessionId: string) => {
    try {
      // Load chat from backend
      const response = await fetch(`${apiUrl}/api/v1/chats/${sessionId}`);
      if (!response.ok) {
        throw new Error("Failed to load chat");
      }

      const chat = await response.json();

      // Update the current chat session with proper date conversion
      const formattedChat = {
        ...chat,
        createdAt: new Date(chat.createdAt),
        messages: chat.messages || [], // Ensure messages is always an array
      };

      setCurrentChatId(sessionId);
      setMessages(formattedChat.messages);

      // Close the dropdown menu after selection
      const dropdownTrigger = document.activeElement as HTMLElement;
      dropdownTrigger?.blur();
    } catch (error) {
      console.error("Error loading chat:", error);
      toast.error("Failed to load chat");
    }
  };

  const refreshChatHistory = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/chats`);
      if (!response.ok) {
        throw new Error("Failed to load chat history");
      }
      const chats = await response.json();

      // Convert ISO date strings to Date objects and ensure proper typing
      const formattedChats = chats.map(
        (chat: {
          id: string;
          messages: Message[];
          createdAt: string;
          title: string;
        }) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          messages: chat.messages || [], // Ensure messages is always an array
        })
      );

      setChatSessions(formattedChats);
    } catch (error) {
      console.error("Error loading chat history:", error);
      toast.error("Failed to load chat history");
    }
  };

  // Add new function to check if a value is numeric
  const isNumeric = (value: unknown) => {
    return !isNaN(parseFloat(value as string)) && isFinite(value as number);
  };

  // Add new function to get numeric columns
  const getNumericColumns = () => {
    if (!queryResults || queryResults.length === 0) return [];
    const firstRow = queryResults[0];
    return Object.keys(firstRow).filter((key) => isNumeric(firstRow[key]));
  };

  const [isQueryEditorExpanded, setIsQueryEditorExpanded] = useState(false);
  const [isResultsExpanded, setIsResultsExpanded] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <div className="w-64 min-w-[16rem] border-r border-gray-200 flex flex-col overflow-hidden">
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
                  setEditValue(workspaceTitle);
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
                  {workspaceTitle || "User's Workspace"}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsEditingWorkspace(true);
                  setEditValue(workspaceTitle);
                }}
                className="hover:bg-gray-100"
              >
                <Pencil className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          )}
        </div>

        <div className="p-4 border-b border-gray-200">
          <Link
            href="/databases"
            className="flex items-center gap-2 text-gray-900"
          >
            <Database className="h-5 w-5 text-gray-600" />
            <span className="font-semibold">Connected Databases</span>
          </Link>
        </div>

        <div className="p-4 flex-1">
          <div className="text-sm text-gray-900 mb-3">QUERIES</div>
          <div className="space-y-2 mb-4">
            {queries.map((query) => (
              <div
                key={query.id}
                className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-50 ${
                  activeQueryId === query.id ? "bg-gray-50" : ""
                }`}
                onClick={() => loadQuery(query.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 truncate">
                    {query.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {query.createdAt.toLocaleDateString()}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-gray-200 rounded-full flex-shrink-0 ml-2"
                  onClick={(e) => deleteQuery(query.id, e)}
                >
                  <X className="h-3 w-3 text-gray-900" />
                </Button>
              </div>
            ))}
          </div>
          <button
            className="flex items-center gap-2 text-gray-900 hover:bg-gray-50 p-2 rounded w-full"
            onClick={createNewQuery}
          >
            <Plus className="h-4 w-4 text-gray-600" />
            <span>New Query</span>
          </button>
        </div>

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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="border-b border-gray-200 flex items-center justify-between h-14 bg-white z-10 relative shrink-0">
          <div className="text-xl px-4 text-gray-900">T2SQL</div>
          <div className="flex items-center gap-4 px-4">
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

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-r border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4 overflow-x-auto">
                <Button
                  className="bg-black text-white hover:bg-gray-800 flex items-center gap-2"
                  onClick={handleQueryRun}
                  disabled={!selectedDatabase || !queryContent.trim()}
                >
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

            <div
              className={`flex-1 border border-gray-200 rounded-lg overflow-hidden m-4 min-h-0 ${
                isQueryEditorExpanded
                  ? "fixed inset-0 z-50 m-0 rounded-none"
                  : ""
              }`}
            >
              <div className="flex justify-between p-3 border-b border-gray-200 bg-white">
                <div className="text-gray-900 font-semibold tracking-wide truncate">
                  {activeQueryId
                    ? queries.find((q) => q.id === activeQueryId)?.title ||
                      "Query Editor"
                    : "New Query"}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-gray-100"
                  onClick={() =>
                    setIsQueryEditorExpanded(!isQueryEditorExpanded)
                  }
                >
                  <Maximize2 className="h-4 w-4 text-gray-600 flex-shrink-0" />
                </Button>
              </div>
              <div className="flex h-[calc(100%-48px)]">
                <div className="w-12 flex-none overflow-hidden relative border-r bg-white">
                  <div
                    ref={lineNumbersRef}
                    className="absolute w-full text-right pr-4 py-3 text-gray-400 select-none"
                    style={{ transform: `translateY(-${scrollPosition}px)` }}
                  >
                    {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
                      <div key={i + 1} className="leading-6 h-6">
                        {i + 1}
                      </div>
                    ))}
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

            <div
              className={`flex-1 border border-gray-200 rounded-lg overflow-hidden m-4 min-h-0 ${
                isResultsExpanded ? "fixed inset-0 z-50 m-0 rounded-none" : ""
              }`}
            >
              <div className="flex justify-between p-3 border-b border-gray-200 bg-white">
                <div className="text-gray-900 font-semibold tracking-wide">
                  Results
                </div>
                <div className="flex items-center gap-2">
                  {queryResults && queryResults.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-gray-100"
                        >
                          <BarChart2 className="h-4 w-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-[200px] bg-white border border-gray-200 shadow-lg"
                      >
                        <DropdownMenuLabel className="text-gray-900 font-semibold px-3 py-2">
                          Chart Type
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-200" />
                        <DropdownMenuItem
                          onClick={() => {
                            setChartType("bar");
                            setShowChart(true);
                            if (!chartConfig && queryResults) {
                              const numericColumns = getNumericColumns();
                              if (numericColumns.length > 0) {
                                const columns = Object.keys(queryResults[0]);
                                setChartConfig({
                                  xAxis: columns[0],
                                  yAxis: numericColumns[0],
                                });
                              }
                            }
                          }}
                          className="text-gray-900 hover:bg-gray-50 cursor-pointer px-3 py-2"
                        >
                          Bar Chart
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setChartType("line");
                            setShowChart(true);
                            if (!chartConfig && queryResults) {
                              const numericColumns = getNumericColumns();
                              if (numericColumns.length > 0) {
                                const columns = Object.keys(queryResults[0]);
                                setChartConfig({
                                  xAxis: columns[0],
                                  yAxis: numericColumns[0],
                                });
                              }
                            }
                          }}
                          className="text-gray-900 hover:bg-gray-50 cursor-pointer px-3 py-2"
                        >
                          Line Chart
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setChartType("pie");
                            setShowChart(true);
                            if (!chartConfig && queryResults) {
                              const numericColumns = getNumericColumns();
                              if (numericColumns.length > 0) {
                                const columns = Object.keys(queryResults[0]);
                                setChartConfig({
                                  xAxis: columns[0],
                                  yAxis: numericColumns[0],
                                });
                              }
                            }
                          }}
                          className="text-gray-900 hover:bg-gray-50 cursor-pointer px-3 py-2"
                        >
                          Pie Chart
                        </DropdownMenuItem>
                        {showChart && (
                          <>
                            <DropdownMenuSeparator className="bg-gray-200" />
                            <DropdownMenuLabel className="text-gray-900 font-semibold px-3 py-2">
                              Configure Axes
                            </DropdownMenuLabel>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="text-gray-900 hover:bg-gray-50 cursor-pointer px-3 py-2">
                                X Axis
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="bg-white border border-gray-200 shadow-lg">
                                {queryResults &&
                                  Object.keys(queryResults[0]).map((column) => (
                                    <DropdownMenuItem
                                      key={column}
                                      onClick={() =>
                                        setChartConfig((prev) => ({
                                          ...prev!,
                                          xAxis: column,
                                        }))
                                      }
                                      className="text-gray-900 hover:bg-gray-50 cursor-pointer px-3 py-2"
                                    >
                                      {column}
                                    </DropdownMenuItem>
                                  ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="text-gray-900 hover:bg-gray-50 cursor-pointer px-3 py-2">
                                Y Axis
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="bg-white border border-gray-200 shadow-lg">
                                {getNumericColumns().map((column) => (
                                  <DropdownMenuItem
                                    key={column}
                                    onClick={() =>
                                      setChartConfig((prev) => ({
                                        ...prev!,
                                        yAxis: column,
                                      }))
                                    }
                                    className="text-gray-900 hover:bg-gray-50 cursor-pointer px-3 py-2"
                                  >
                                    {column}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-gray-100"
                    onClick={() => setIsResultsExpanded(!isResultsExpanded)}
                  >
                    <Maximize2 className="h-4 w-4 text-gray-600 flex-shrink-0" />
                  </Button>
                </div>
              </div>
              <div className="h-[calc(100%-48px)] overflow-auto">
                {queryError ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <div className="text-red-500 mb-2">
                      Error executing query
                    </div>
                    <div className="text-sm text-gray-600">{queryError}</div>
                  </div>
                ) : queryResults ? (
                  <>
                    {showChart && chartConfig && (
                      <ChartView
                        type={chartType}
                        data={queryResults}
                        xAxis={chartConfig.xAxis}
                        yAxis={chartConfig.yAxis}
                      />
                    )}
                    <div className="relative w-full h-full overflow-auto">
                      <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr className="bg-gray-50">
                              {Object.keys(queryResults[0]).map((key) => (
                                <th
                                  key={key}
                                  className="sticky top-0 z-10 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 bg-gray-50 border-b border-gray-200 whitespace-nowrap"
                                  style={{ minWidth: "150px" }}
                                >
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {queryResults.map((row, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                {Object.values(row).map(
                                  (value: TableCellValue, j) => (
                                    <td
                                      key={j}
                                      className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200 whitespace-nowrap"
                                      style={{ minWidth: "150px" }}
                                    >
                                      <div
                                        className="truncate"
                                        title={value?.toString() ?? "null"}
                                      >
                                        {value?.toString() ?? "null"}
                                      </div>
                                    </td>
                                  )
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-4">
                    <div className="mb-2">No results to display</div>
                    <div className="text-sm">Run a query to see results</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isAssistantVisible && (
            <>
              {/* Add draggable divider */}
              <div
                className={`w-1 bg-gray-200 cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors ${
                  isDragging ? "bg-blue-600" : ""
                }`}
                onMouseDown={handleMouseDown}
              />

              {/* Update assistant panel with dynamic width */}
              <div
                className="border-l border-gray-200 flex flex-col overflow-hidden"
                style={{
                  width: `${assistantWidth}px`,
                  minWidth: "280px",
                  maxWidth: "600px",
                  transition: isDragging ? "none" : "width 0.1s ease-out",
                }}
              >
                <div className="p-4 border-b border-gray-200 flex items-center justify-between relative shrink-0">
                  <DropdownMenu
                    onOpenChange={(open) => {
                      if (open) {
                        refreshChatHistory();
                      }
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-3 hover:bg-gray-100"
                        onClick={() => refreshChatHistory()}
                      >
                        <History className="h-4 w-4 text-gray-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-[250px] bg-white border border-gray-200 shadow-lg"
                      sideOffset={5}
                    >
                      <DropdownMenuLabel className="px-3 py-2">
                        <span className="text-sm font-semibold text-gray-900">
                          Chat History
                        </span>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="h-[1px] bg-gray-200" />
                      {chatSessions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No chat history
                        </div>
                      ) : (
                        chatSessions.map((session) => (
                          <DropdownMenuItem
                            key={session.id}
                            onSelect={() => switchChat(session.id)}
                            className={`flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                              currentChatId === session.id ? "bg-gray-50" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <MessageSquare className="h-4 w-4 text-gray-900 flex-shrink-0" />
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-sm text-gray-900 truncate">
                                  {session.title}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(
                                    session.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {chatSessions.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-gray-200 rounded-full flex-shrink-0 ml-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteChat(session.id, e);
                                }}
                              >
                                <X className="h-3 w-3 text-gray-900" />
                              </Button>
                            )}
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="flex-1 flex justify-center">
                    <span className="font-semibold tracking-wide text-gray-900">
                      Assistant
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={createNewChat}
                    >
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

                <div className="flex-1 overflow-hidden flex flex-col">
                  {renderAssistantContent()}
                  <div className="p-4 border-t border-gray-200 shrink-0">
                    {renderAssistantInput()}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
