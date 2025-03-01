"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { DatabaseConnection } from "@/types/database";

export default function TursoConnectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    display_name: "",
    host: "",
    port: "5432",
    database: "",
    username: "",
    password: "",
    ip_whitelist: [] as string[],
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
      const response = await fetch(
        "http://localhost:8000/api/test-connection",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "turbodb",
            display_name: formData.display_name,
            host: formData.host,
            port: parseInt(formData.port),
            database: formData.database,
            username: formData.username,
            password: formData.password,
            ip_whitelist: ipAddresses,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to connect to database");
      }

      // Check for duplicate connections
      const existingConnections = JSON.parse(
        localStorage.getItem("databaseConnections") || "[]"
      );

      const isDuplicate = existingConnections.some(
        (conn: any) =>
          conn.host === formData.host &&
          conn.database === formData.database &&
          conn.username === formData.username &&
          conn.type === "turbodb"
      );

      if (isDuplicate) {
        throw new Error("Database Connection Already Exists");
      }

      // If no duplicate, proceed with saving
      const dbConnection = {
        id: Date.now().toString(),
        name: formData.display_name,
        type: "turbodb",
        host: formData.host,
        port: formData.port,
        database: formData.database,
        username: formData.username,
        password: formData.password,
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
          Connect TursoDB&apos;s SQLite Database
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="display_name">
              Display Name<span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="text-sm text-gray-500 mb-1">
              Name of the database to be displayed in T2SQL
            </div>
            <Input
              id="display_name"
              name="display_name"
              value={formData.display_name}
              onChange={handleInputChange}
              placeholder="My TursoDB Database"
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="host">
              Host URL<span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="text-sm text-gray-500 mb-1">
              Host LibSQL URL of the SQLite database
            </div>
            <Input
              id="host"
              name="host"
              value={formData.host}
              onChange={handleInputChange}
              placeholder="libsql://sequel-database.turso.io"
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="port">
              Port<span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="text-sm text-gray-500 mb-1">
              Port of the database
            </div>
            <Input
              id="port"
              name="port"
              value={formData.port}
              onChange={handleInputChange}
              placeholder="5432"
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="database">
              Database<span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="text-sm text-gray-500 mb-1">
              Name of the database
            </div>
            <Input
              id="database"
              name="database"
              value={formData.database}
              onChange={handleInputChange}
              placeholder="sequel-database"
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">
              Username<span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="text-sm text-gray-500 mb-1">
              Username to connect to the database
            </div>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password<span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="text-sm text-gray-500 mb-1">
              Password to connect to the database
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
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
            {testing ? "Testing Connection..." : "Test and Save Connection"}
          </Button>
        </form>
      </div>
    </div>
  );
}
