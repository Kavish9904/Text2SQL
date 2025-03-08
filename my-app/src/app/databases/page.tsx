"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MoreVertical,
  Database,
  ExternalLink,
  Trash2,
  Grid,
  Plus,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface DatabaseConnection {
  id: string;
  name: string;
  type: string;
  host: string;
}

export default function DatabasesPage() {
  const router = useRouter();
  const [databases, setDatabases] = useState<DatabaseConnection[]>([]);
  const [databaseToDelete, setDatabaseToDelete] = useState<string | null>(null);
  const [databaseToEdit, setDatabaseToEdit] =
    useState<DatabaseConnection | null>(null);
  const [newName, setNewName] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    console.log("Current path:", window.location.pathname);
    try {
      const savedConnections = localStorage.getItem("databaseConnections");
      console.log("Saved connections:", savedConnections);
      if (savedConnections) {
        const connections = JSON.parse(savedConnections);
        setDatabases(connections);
        console.log("Loaded connections:", connections);
      }
    } catch (error) {
      console.error("Error loading connections:", error);
      setDatabases([]);
    }
  }, []);

  const confirmDelete = () => {
    if (databaseToDelete) {
      const updatedDatabases = databases.filter(
        (db) => db.id !== databaseToDelete
      );
      setDatabases(updatedDatabases);
      localStorage.setItem(
        "databaseConnections",
        JSON.stringify(updatedDatabases)
      );
      setDatabaseToDelete(null);
      toast.success("Database connection removed");
    }
  };

  const handleEdit = (database: DatabaseConnection) => {
    setDatabaseToEdit(database);
    setNewName(database.name);
    setIsEditDialogOpen(true);
  };

  const confirmEdit = () => {
    if (databaseToEdit && newName.trim()) {
      const updatedDatabases = databases.map((db) =>
        db.id === databaseToEdit.id ? { ...db, name: newName.trim() } : db
      );
      setDatabases(updatedDatabases);
      localStorage.setItem(
        "databaseConnections",
        JSON.stringify(updatedDatabases)
      );
      setDatabaseToEdit(null);
      setNewName("");
      setIsEditDialogOpen(false);
      toast.success("Database name updated");
    }
  };

  console.log("Current databases:", databases);

  const handleAddDatabase = () => {
    router.push("/connect");
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
                onClick={handleAddDatabase}
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
          className="mb-8 hover:bg-gray-100 text-gray-900"
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
            onClick={handleAddDatabase}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Database
          </Button>
        </div>

        <div className="space-y-4">
          {databases.map((database) => (
            <Card key={database.id} className="bg-white">
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
                    <DropdownMenuContent
                      align="end"
                      className="bg-white min-w-[160px]"
                    >
                      <DropdownMenuItem
                        className="flex items-center text-gray-900 hover:bg-gray-100 cursor-pointer"
                        asChild
                      >
                        <div onClick={() => handleEdit(database)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center text-red-600 hover:bg-gray-100 cursor-pointer"
                        asChild
                      >
                        <div onClick={() => setDatabaseToDelete(database.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </div>
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
          onOpenChange={(open) => !open && setDatabaseToDelete(null)}
        >
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-900">
                Delete Database
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                Are you sure you want to delete this database connection? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border border-gray-200 bg-white text-gray-900 hover:bg-gray-100">
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

        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setDatabaseToEdit(null);
              setNewName("");
              setIsEditDialogOpen(false);
            }
          }}
        >
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-gray-900">
                Edit Database Name
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Change the display name for this database connection.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-900"
                >
                  Database Name
                </label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter database name"
                  className="w-full"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDatabaseToEdit(null);
                  setNewName("");
                  setIsEditDialogOpen(false);
                }}
                className="border border-gray-200 bg-white text-gray-900 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmEdit}
                className="bg-black text-white hover:bg-gray-800"
                disabled={!newName.trim()}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
