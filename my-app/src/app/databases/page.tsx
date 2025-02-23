"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MoreVertical,
  Database,
  ExternalLink,
  Trash2,
  Grid,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DatabaseConnection {
  id: string;
  name: string;
  type: string;
  host: string;
  lastUsed: string;
}

export default function DatabasesPage() {
  const router = useRouter();
  const [databases, setDatabases] = useState<DatabaseConnection[]>([]);
  const [databaseToDelete, setDatabaseToDelete] = useState<string | null>(null);

  const confirmDelete = () => {
    if (databaseToDelete) {
      setDatabases((prevDatabases) =>
        prevDatabases.filter((db) => db.id !== databaseToDelete)
      );
      setDatabaseToDelete(null);
    }
  };

  if (databases.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-8 hover:bg-gray-100 -ml-3 text-black"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                <Grid className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-semibold text-black">
                  No connected databases
                </h1>
                <p className="text-black max-w-sm">
                  Connect your database to start querying and visualizing your
                  data.
                </p>
              </div>
              <Button
                onClick={() => router.push("/connect")}
                size="lg"
                className="mt-6 bg-black text-white hover:bg-gray-800"
              >
                <Plus className="mr-2 h-4 w-4" />
                Connect Database
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-8 hover:bg-gray-100 -ml-3"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black">
              Connected Databases
            </h1>
            <p className="mt-2 text-black">
              Manage your database connections and settings.
            </p>
          </div>
          <Button
            onClick={() => router.push("/connect")}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Database
          </Button>
        </div>

        <div className="space-y-4">
          {databases.map((database) => (
            <Card key={database.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Database className="h-8 w-8 text-black" />
                    <div>
                      <h3 className="text-xl font-semibold text-black">
                        {database.name}
                      </h3>
                      <p className="text-black">{database.type}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 text-black"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-black">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Connection
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onSelect={() => setDatabaseToDelete(database.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <AlertDialog
          open={!!databaseToDelete}
          onOpenChange={(open: boolean) => !open && setDatabaseToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-black">
                Delete Database
              </AlertDialogTitle>
              <AlertDialogDescription className="text-black">
                Are you sure you want to delete this database connection? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-black">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={confirmDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
