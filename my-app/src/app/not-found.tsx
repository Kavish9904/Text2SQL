"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-black">404 - Page Not Found</h1>
        <p className="text-gray-600">
          The page you're looking for doesn't exist.
        </p>
        <Button
          onClick={() => router.push("/")}
          className="bg-black text-white hover:bg-gray-800"
        >
          Go Home
        </Button>
      </div>
    </div>
  );
}
