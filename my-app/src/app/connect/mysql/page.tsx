"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { DatabaseConnection } from "@/types/database";

export default function MySQLConnectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    displayName: "",
    hostAddress: "",
    port: "3306",
    database: "",
    username: "root",
    password: "",
    ssl: false,
  });
  const [testing, setTesting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSslChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, ssl: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);

    try {
      const response = await fetch(
        "https://text2sql-backend.onrender.com/api/test-connection",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "mysql",
            display_name: formData.displayName,
            host: formData.hostAddress,
            port: parseInt(formData.port),
            database: formData.database,
            username: formData.username,
            password: formData.password,
            ssl: formData.ssl,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to connect to database");
      }

      // Check for duplicate connections
      const existingConnections: DatabaseConnection[] = JSON.parse(
        localStorage.getItem("databaseConnections") || "[]"
      );

      const isDuplicate = existingConnections.some(
        (conn: DatabaseConnection) =>
          conn.host === formData.hostAddress &&
          conn.database === formData.database &&
          conn.username === formData.username
      );

      if (isDuplicate) {
        throw new Error("Database Connection Already Exists");
      }

      // If no duplicate, proceed with saving
      const dbConnection: DatabaseConnection = {
        id: Date.now().toString(),
        name: formData.displayName,
        type: "mysql",
        host: formData.hostAddress,
        port: parseInt(formData.port),
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

        <h1 className="text-2xl font-bold mb-8">Connect MySQL Database</h1>

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
              placeholder="MySQL Database"
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hostAddress">
              Host address<span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="text-sm text-gray-500 mb-1">
              Host URL/IP of the MySQL database
            </div>
            <Input
              id="hostAddress"
              name="hostAddress"
              value={formData.hostAddress}
              onChange={handleInputChange}
              placeholder="mysql-database.com"
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="port">
              Port<span className="text-red-500 ml-0.5">*</span>
            </Label>
            <div className="text-sm text-gray-500 mb-1">
              Port at which the MySQL database is running
            </div>
            <Input
              id="port"
              name="port"
              value={formData.port}
              onChange={handleInputChange}
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

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SSL</Label>
              <div className="text-sm text-gray-500">
                Enable SSL for secure connection
              </div>
            </div>
            <Switch
              checked={formData.ssl}
              onCheckedChange={handleSslChange}
              className="bg-black data-[state=unchecked]:opacity-70 data-[state=checked]:opacity-100 [&>span]:bg-white"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-gray-800"
            disabled={testing}
          >
            {testing ? "Testing Connection..." : "Test and Save Connection"}
          </Button>
        </form>
      </div>
    </div>
  );
}
