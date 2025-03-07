"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface DatabaseConnection {
  id: string;
  name: string;
  type: string;
  host: string;
}

// This is a client component, so we'll handle the dynamic nature on the client side
export default function EditDatabasePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [database, setDatabase] = useState<DatabaseConnection | null>(null);
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load the database connection from localStorage
    try {
      const savedConnections = localStorage.getItem("databaseConnections");
      if (savedConnections) {
        const connections = JSON.parse(savedConnections);
        const currentDatabase = connections.find(
          (db: DatabaseConnection) => db.id === params.id
        );
        if (currentDatabase) {
          setDatabase(currentDatabase);
          setNewName(currentDatabase.name);
        } else {
          // Handle case where database is not found
          toast.error("Database not found");
          router.push("/databases");
        }
      }
    } catch (error) {
      console.error("Error loading database:", error);
      toast.error("Error loading database");
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router]);

  const handleSave = () => {
    if (!newName.trim()) {
      toast.error("Database name cannot be empty");
      return;
    }

    try {
      // Update the database name in localStorage
      const savedConnections = localStorage.getItem("databaseConnections");
      if (savedConnections) {
        const connections = JSON.parse(savedConnections);
        const updatedConnections = connections.map((db: DatabaseConnection) =>
          db.id === params.id ? { ...db, name: newName.trim() } : db
        );
        localStorage.setItem(
          "databaseConnections",
          JSON.stringify(updatedConnections)
        );
        toast.success("Database name updated successfully");
        router.push("/databases");
      }
    } catch (error) {
      console.error("Error saving database:", error);
      toast.error("Error saving database");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!database && !isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Database not found</p>
          <Button
            variant="ghost"
            onClick={() => router.push("/databases")}
            className="mt-4 hover:bg-gray-100 text-gray-900"
          >
            Back to Databases
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Button
          variant="ghost"
          onClick={() => router.push("/databases")}
          className="mb-8 hover:bg-gray-100 text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Databases
        </Button>

        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-black mb-8">
            Edit Database Name
          </h1>

          <div className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-gray-900"
              >
                Database Name
              </label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter database name"
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={handleSave}
                className="bg-black text-white hover:bg-gray-800"
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/databases")}
                className="border border-gray-200 hover:bg-gray-100"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
