"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";

export default function ConnectPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="flex items-center text-black hover:bg-transparent hover:text-gray-600 px-0 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          Back to Dashboard
        </Button>

        <h1 className="text-2xl font-bold mb-8">Connect a Database</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/connect/clickhouse")}
            className="w-full h-auto p-4 flex flex-col items-start gap-2 hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold">ClickHouse</h2>
            <p className="text-sm text-gray-500 text-left">
              Connect to a ClickHouse database for high-performance analytics
            </p>
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/connect/mysql")}
            className="w-full h-auto p-4 flex flex-col items-start gap-2 hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold">MySQL</h2>
            <p className="text-sm text-gray-500 text-left">
              Connect to a MySQL database for relational data storage
            </p>
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/connect/cloudflare")}
            className="w-full h-auto p-4 flex flex-col items-start gap-2 hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold">Cloudflare D1</h2>
            <p className="text-sm text-gray-500 text-left">
              Connect to a Cloudflare D1 database for serverless SQL
            </p>
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/connect/motherduck")}
            className="w-full h-auto p-4 flex flex-col items-start gap-2 hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold">MotherDuck</h2>
            <p className="text-sm text-gray-500 text-left">
              Connect to a MotherDuck database for serverless analytics
            </p>
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/connect/postgresql")}
            className="w-full h-auto p-4 flex flex-col items-start gap-2 hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold">PostgreSQL</h2>
            <p className="text-sm text-gray-500 text-left">
              Connect to a PostgreSQL database for powerful relational data
              storage
            </p>
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/connect/mysql")}
            className="w-full h-auto p-4 flex flex-col items-start gap-2 hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold">MySQL</h2>
            <p className="text-sm text-gray-500 text-left">
              Connect to a MySQL database for relational data storage
            </p>
          </Button>
        </div>
      </div>
    </div>
  );
}
