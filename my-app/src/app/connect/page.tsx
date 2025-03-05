"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Integration {
  id: string;
  name: string;
  icon: string;
}

export default function ConnectPage() {
  const router = useRouter();

  const integrations: Integration[] = [
    {
      id: "postgresql",
      name: "PostgreSQL",
      icon: "🐘",
    },
    {
      id: "tursodb",
      name: "TursoDB",
      icon: "🐂",
    },
    {
      id: "cloudflare",
      name: "Cloudflare D1",
      icon: "☁️",
    },
    {
      id: "mysql",
      name: "MySQL",
      icon: "🐬",
    },
    {
      id: "clickhouse",
      name: "ClickHouse",
      icon: "📊",
    },
    {
      id: "motherduck",
      name: "MotherDuck",
      icon: "🦆",
    },
  ];

  const handleIntegrationClick = (integrationId: string) => {
    router.push(`/connect/${integrationId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto p-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="flex items-center text-black hover:bg-transparent hover:text-gray-600 px-0 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-4xl font-bold text-black mb-2">
          Add New Integration
        </h1>
        <p className="text-gray-600 text-lg mb-8">
          Start querying your data with T2SQL. Select a data source to begin.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((integration) => (
            <Card
              key={integration.id}
              className="group relative hover:border-gray-300 cursor-pointer p-4"
              onClick={() => handleIntegrationClick(integration.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{integration.icon}</span>
                  <h3 className="text-lg font-medium text-black">
                    {integration.name}
                  </h3>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
