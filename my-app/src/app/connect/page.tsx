"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import Image from "next/image";

export default function ConnectPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-8 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Add New Integration
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Start querying your data with T2SQL. Select a data source to begin.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/connect/postgresql")}
            className="flex items-center space-x-3 h-16 px-4 hover:border-gray-400 hover:bg-gray-50"
          >
            <div className="w-8 h-8 relative flex-shrink-0">
              <Image
                src="/database-icons/postgresql.svg"
                alt="PostgreSQL"
                width={32}
                height={32}
              />
            </div>
            <span className="font-medium">PostgreSQL</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/connect/tursodb")}
            className="flex items-center space-x-3 h-16 px-4 hover:border-gray-400 hover:bg-gray-50"
          >
            <div className="w-8 h-8 relative flex-shrink-0">
              <Image
                src="/database-icons/tursodb.svg"
                alt="TursoDB"
                width={32}
                height={32}
              />
            </div>
            <span className="font-medium">TursoDB</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/connect/cloudflare")}
            className="flex items-center space-x-3 h-16 px-4 hover:border-gray-400 hover:bg-gray-50"
          >
            <div className="w-8 h-8 relative flex-shrink-0">
              <Image
                src="/database-icons/cloudflare.svg"
                alt="Cloudflare D1"
                width={32}
                height={32}
              />
            </div>
            <span className="font-medium">Cloudflare D1</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/connect/mysql")}
            className="flex items-center space-x-3 h-16 px-4 hover:border-gray-400 hover:bg-gray-50"
          >
            <div className="w-8 h-8 relative flex-shrink-0">
              <Image
                src="/database-icons/mysql.svg"
                alt="MySQL"
                width={32}
                height={32}
              />
            </div>
            <span className="font-medium">MySQL</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/connect/clickhouse")}
            className="flex items-center space-x-3 h-16 px-4 hover:border-gray-400 hover:bg-gray-50"
          >
            <div className="w-8 h-8 relative flex-shrink-0">
              <Image
                src="/database-icons/clickhouse.svg"
                alt="ClickHouse"
                width={32}
                height={32}
              />
            </div>
            <span className="font-medium">ClickHouse</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/connect/motherduck")}
            className="flex items-center space-x-3 h-16 px-4 hover:border-gray-400 hover:bg-gray-50"
          >
            <div className="w-8 h-8 relative flex-shrink-0">
              <Image
                src="/database-icons/motherduck.svg"
                alt="MotherDuck"
                width={32}
                height={32}
              />
            </div>
            <span className="font-medium">MotherDuck</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
