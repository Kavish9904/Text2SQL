"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome to your T2SQL Dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Database Connection Card */}
          <Card className="p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-4">Database Connections</h2>
            <p className="text-gray-600 mb-4">
              Manage your database connections and settings
            </p>
            <Button
              onClick={() => router.push("/databases")}
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              View Connections
            </Button>
          </Card>

          {/* Profile Card */}
          <Card className="p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
            <p className="text-gray-600 mb-4">
              Update your profile and preferences
            </p>
            <Button
              onClick={() => router.push("/profile")}
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              View Profile
            </Button>
          </Card>

          {/* Pricing Card */}
          <Card className="p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-4">Subscription</h2>
            <p className="text-gray-600 mb-4">
              View and manage your subscription plan
            </p>
            <Button
              onClick={() => router.push("/pricing")}
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              View Plans
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
