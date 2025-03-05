"use client";

import type React from "react";
import type {
  DatabaseConnection,
  TurboDBConnection,
} from "../../../types/database";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { toast } from "../../../components/ui/use-toast";
import { apiUrl, testApiConnection } from "../../../lib/api";

export default function TurboDBConnectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    displayName: "",
    apiKey: "", // TurboDB API key
    database: "",
    organization: "", // TurboDB organization ID
  });
  const [testing, setTesting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);

    try {
      const apiConnected = await testApiConnection();
      if (!apiConnected) {
        throw new Error(
          "Cannot connect to the backend API. Please check if the backend server is running."
        );
      }

      const response = await fetch(`${apiUrl}/api/test-connection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "turbodb",
          display_name: formData.displayName,
          api_key: formData.apiKey,
          database: formData.database,
          organization: formData.organization,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail ||
            "Failed to connect to TurboDB. Please check your API key and ensure the database exists."
        );
      }

      const existingConnections: DatabaseConnection[] = JSON.parse(
        localStorage.getItem("databaseConnections") || "[]"
      );

      const isDuplicate = existingConnections.some(
        (conn: DatabaseConnection) =>
          conn.type === "turbodb" &&
          (conn as TurboDBConnection).database === formData.database &&
          (conn as TurboDBConnection).organization === formData.organization
      );

      if (isDuplicate) {
        throw new Error("This database connection already exists.");
      }

      const dbConnection: TurboDBConnection = {
        id: Date.now().toString(),
        name: formData.displayName,
        type: "turbodb",
        database: formData.database,
        apiKey: formData.apiKey,
        organization: formData.organization,
        lastUsed: new Date().toISOString(),
      };

      existingConnections.push(dbConnection);
      localStorage.setItem(
        "databaseConnections",
        JSON.stringify(existingConnections)
      );

      toast.success(
        "TurboDB connection successful! Redirecting to databases page..."
      );

      setTimeout(() => {
        router.push("/databases");
      }, 1500);
    } catch (error) {
      console.error("Connection error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to connect to TurboDB. Please check your settings."
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Button
          variant="ghost"
          onClick={() => router.push("/connect")}
          className="mb-8 text-gray-900 hover:text-gray-900 hover:bg-gray-100 -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Integrations
        </Button>

        <h1 className="text-2xl font-bold mb-8">Connect TurboDB Database</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">
              Display Name<span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="text-sm text-gray-500 mb-1">
              Name of the database to be displayed in T2SQL
            </div>
            <Input
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="My TurboDB Database"
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">
              API Key<span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="text-sm text-gray-500 mb-1">
              Your TurboDB API key
            </div>
            <Input
              id="apiKey"
              name="apiKey"
              type="password"
              value={formData.apiKey}
              onChange={handleInputChange}
              placeholder="turbo_xxxxxxxxxxxxxxxxxxxx"
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">
              Organization ID<span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="text-sm text-gray-500 mb-1">
              Your TurboDB organization identifier
            </div>
            <Input
              id="organization"
              name="organization"
              value={formData.organization}
              onChange={handleInputChange}
              placeholder="org_xxxxxxxxxxxxxxxxxxxx"
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="database">
              Database<span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="text-sm text-gray-500 mb-1">
              Name of the database to connect to
            </div>
            <Input
              id="database"
              name="database"
              value={formData.database}
              onChange={handleInputChange}
              placeholder="my_database"
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-gray-900"
            disabled={testing}
          >
            {testing ? "Testing Connection..." : "Test and Save Connection"}
          </Button>
        </form>
      </div>
    </div>
  );
}
