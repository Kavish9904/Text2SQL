"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { DatabaseConnection } from "@/types/database";

export default function CloudflareConnectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    displayName: "",
    accountId: "",
    databaseId: "",
    apiToken: "",
  });
  const [copiedIPs, setCopiedIPs] = useState<{ [key: string]: boolean }>({});
  const [testing, setTesting] = useState(false);

  const ipAddresses = ["139.59.53.167", "165.22.217.42"];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const copyToClipboard = async (ip: string) => {
    await navigator.clipboard.writeText(ip);
    setCopiedIPs((prev) => ({ ...prev, [ip]: true }));
    setTimeout(() => {
      setCopiedIPs((prev) => ({ ...prev, [ip]: false }));
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);

    try {
      const existingConnections = JSON.parse(
        localStorage.getItem("databaseConnections") || "[]"
      );

      const isDuplicate = existingConnections.some(
        (conn: DatabaseConnection) =>
          conn.type === "cloudflare" &&
          conn.accountId === formData.accountId &&
          conn.databaseId === formData.databaseId
      );

      if (isDuplicate) {
        toast.error("This database is already connected");
        return;
      }

      const response = await fetch(
        "http://localhost:8000/api/test-connection",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            display_name: formData.displayName,
            type: "cloudflare",
            account_id: formData.accountId,
            database_id: formData.databaseId,
            api_token: formData.apiToken,
            ip_whitelist: ipAddresses,
            // Required fields but not used for Cloudflare
            host: "",
            port: 0,
            database: "",
            username: "",
            password: "",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Connection failed");
      }

      // Save to localStorage
      const dbConnection = {
        id: Date.now().toString(),
        name: formData.displayName,
        type: "cloudflare",
        accountId: formData.accountId,
        databaseId: formData.databaseId,
        apiToken: formData.apiToken,
        lastUsed: new Date().toISOString(),
      };

      existingConnections.push(dbConnection);
      localStorage.setItem(
        "databaseConnections",
        JSON.stringify(existingConnections)
      );

      toast.success("Database connection successful!");
      router.push("/databases");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Connection failed");
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
          Connect Cloudflare&apos;s D1 SQLite Database
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
              placeholder="My Cloudflare D1 Database"
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId">
              Account ID<span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="text-sm text-gray-500 mb-1">
              Your Cloudflare account ID
            </div>
            <Input
              id="accountId"
              name="accountId"
              value={formData.accountId}
              onChange={handleInputChange}
              placeholder="Cloudflare account ID"
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="databaseId">
              Database ID<span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="text-sm text-gray-500 mb-1">
              Your Cloudflare D1 database ID
            </div>
            <Input
              id="databaseId"
              name="databaseId"
              value={formData.databaseId}
              onChange={handleInputChange}
              placeholder="D1 database ID"
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiToken">
              API Token<span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="text-sm text-gray-500 mb-1">
              Your Cloudflare API token
            </div>
            <Input
              id="apiToken"
              name="apiToken"
              type="password"
              value={formData.apiToken}
              onChange={handleInputChange}
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>IP Whitelist</Label>
            <div className="text-sm text-gray-500 mb-1">
              Please whitelist the following IPs if your database has a firewall
            </div>
            <div className="space-y-2">
              {ipAddresses.map((ip) => (
                <div
                  key={ip}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md"
                >
                  <code className="text-gray-900">{ip}</code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(ip)}
                    className="h-8 w-8 text-gray-500 hover:text-gray-900"
                  >
                    {copiedIPs[ip] ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-gray-900"
            disabled={testing}
          >
            {testing ? "Testing..." : "Test and Save Connection"}
          </Button>
        </form>
      </div>
    </div>
  );
}
