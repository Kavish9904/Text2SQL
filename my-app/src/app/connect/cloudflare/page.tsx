"use client";

import type React from "react";
import {
  DatabaseConnection,
  CloudflareConnection,
} from "../../../types/database";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { toast } from "../../../components/ui/use-toast";
import { apiUrl, testApiConnection } from "../../../lib/api";

export default function CloudflareD1ConnectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    displayName: "",
    accountId: "", // Cloudflare account ID
    apiToken: "", // Cloudflare API token
    databaseName: "", // D1 database ID
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
          type: "cloudflare",
          display_name: formData.displayName,
          account_id: formData.accountId,
          api_token: formData.apiToken,
          database_name: formData.databaseName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail ||
            "Failed to connect to Cloudflare D1. Please check your credentials and ensure the database exists."
        );
      }

      const existingConnections: DatabaseConnection[] = JSON.parse(
        localStorage.getItem("databaseConnections") || "[]"
      );

      const isDuplicate = existingConnections.some(
        (conn: DatabaseConnection) =>
          conn.type === "cloudflare" &&
          (conn as CloudflareConnection).accountId === formData.accountId &&
          (conn as CloudflareConnection).databaseName === formData.databaseName
      );

      if (isDuplicate) {
        throw new Error("This database connection already exists.");
      }

      const dbConnection: CloudflareConnection = {
        id: Date.now().toString(),
        name: formData.displayName,
        type: "cloudflare",
        accountId: formData.accountId,
        apiToken: formData.apiToken,
        databaseName: formData.databaseName,
        lastUsed: new Date().toISOString(),
      };

      existingConnections.push(dbConnection);
      localStorage.setItem(
        "databaseConnections",
        JSON.stringify(existingConnections)
      );

      toast.success(
        "Cloudflare D1 connection successful! Redirecting to databases page..."
      );

      setTimeout(() => {
        router.push("/databases");
      }, 1500);
    } catch (error) {
      console.error("Connection error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to connect to Cloudflare D1. Please check your settings."
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

        <h1 className="text-2xl font-bold mb-8">
          Connect Cloudflare D1 Database
        </h1>

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
              placeholder="My D1 Database"
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId">
              Account ID<span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="text-sm text-gray-500 mb-1">
              Your Cloudflare account identifier
            </div>
            <Input
              id="accountId"
              name="accountId"
              value={formData.accountId}
              onChange={handleInputChange}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiToken">
              API Token<span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="text-sm text-gray-500 mb-1">
              Your Cloudflare API token with D1 access
            </div>
            <Input
              id="apiToken"
              name="apiToken"
              type="password"
              value={formData.apiToken}
              onChange={handleInputChange}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="databaseName">
              Database ID<span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="text-sm text-gray-500 mb-1">
              Your D1 database identifier
            </div>
            <Input
              id="databaseName"
              name="databaseName"
              value={formData.databaseName}
              onChange={handleInputChange}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
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
