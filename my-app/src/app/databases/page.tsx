"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "../../components/ui/use-toast";
import type { DatabaseConnection } from "../../types/database";

export default function DatabasesPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);

  useEffect(() => {
    const storedConnections = localStorage.getItem("databaseConnections");
    if (storedConnections) {
      setConnections(JSON.parse(storedConnections));
    }
  }, []);

  const handleDelete = (id: string) => {
    const updatedConnections = connections.filter((conn) => conn.id !== id);
    localStorage.setItem(
      "databaseConnections",
      JSON.stringify(updatedConnections)
    );
    setConnections(updatedConnections);
    toast.success("Database connection removed successfully");
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="mb-8 hover:bg-gray-100 -ml-3 text-black"
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Database Connections</h1>
            <p className="text-gray-500 mt-2">
              Manage your database connections and their settings
            </p>
          </div>
          <Button
            onClick={() => router.push("/connect")}
            className="bg-black text-white hover:bg-gray-900"
          >
            Add New Connection
          </Button>
        </div>

        {connections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No database connections found</p>
            <Button
              onClick={() => router.push("/connect")}
              className="bg-black text-white hover:bg-gray-900"
            >
              Add Your First Connection
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="border rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold">{connection.name}</h2>
                    <p className="text-gray-500 text-sm mt-1">
                      Type: {connection.type}
                    </p>
                    <p className="text-gray-500 text-sm">
                      Last used:{" "}
                      {new Date(connection.lastUsed).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        router.push(
                          `/connect/${connection.type}/${connection.id}`
                        )
                      }
                      className="text-sm"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(connection.id)}
                      className="text-sm text-red-600 hover:text-red-700 hover:border-red-600"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
