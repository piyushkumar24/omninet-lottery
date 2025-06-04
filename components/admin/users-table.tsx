"use client";

import { useState } from "react";
import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MoreHorizontal, 
  Shield, 
  User, 
  Ban,
  CheckCircle,
  Trash2,
  Search,
  Calendar,
  Mail,
  Ticket
} from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isBlocked: boolean;
  createdAt: Date;
  ticketCount: number;
  totalTicketsEarned: number;
}

interface UsersTableProps {
  users: User[];
}

export const UsersTable = ({ users }: UsersTableProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "email" | "createdAt" | "ticketCount">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter users based on search term (name and email)
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort filtered users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue: any = a[sortBy];
    let bValue: any = b[sortBy];

    if (sortBy === "createdAt") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (sortBy === "name" || sortBy === "email") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? "↑" : "↓";
  };

  const blockUser = async (userId: string, currentStatus: boolean) => {
    try {
      setLoading(userId);
      const response = await fetch(`/api/admin/user/block/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isBlocked: !currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      toast.success(`User ${currentStatus ? "unblocked" : "blocked"} successfully`);
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setLoading(userId);
      const response = await fetch(`/api/admin/user/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      toast.success("User deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 absolute top-1/2 transform -translate-y-1/2 left-3 text-slate-500" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-500">
            {sortedUsers.length} user{sortedUsers.length !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{sortedUsers.length}</p>
          <p className="text-sm text-blue-600">Total Users</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700">
            {sortedUsers.filter(u => u.role === "ADMIN").length}
          </p>
          <p className="text-sm text-green-600">Admins</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-700">
            {sortedUsers.filter(u => u.isBlocked).length}
          </p>
          <p className="text-sm text-yellow-600">Blocked</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-purple-700">
            {sortedUsers.reduce((sum, user) => sum + user.ticketCount, 0)}
          </p>
          <p className="text-sm text-purple-600">Available Tickets</p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-indigo-700">
            {sortedUsers.reduce((sum, user) => sum + user.totalTicketsEarned, 0)}
          </p>
          <p className="text-sm text-indigo-600">Total Earned</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Name {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort("email")}
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email {getSortIcon("email")}
                </div>
              </TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Joined {getSortIcon("createdAt")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort("ticketCount")}
              >
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  Available Tickets {getSortIcon("ticketCount")}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  Total Earned
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {user.name}
                  </div>
                </TableCell>
                <TableCell className="text-slate-600">{user.email}</TableCell>
                <TableCell>
                  {user.role === "ADMIN" ? (
                    <Badge variant="default" className="bg-indigo-600">
                      <Shield className="h-3 w-3 mr-1" /> Admin
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <User className="h-3 w-3 mr-1" /> User
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.isBlocked ? (
                    <Badge variant="destructive">Blocked</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {formatDate(new Date(user.createdAt), 'dateOnly')}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(user.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.ticketCount > 0 ? "outline" : "secondary"} className={
                    user.ticketCount > 0 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : "bg-slate-100 text-slate-500"
                  }>
                    {user.ticketCount}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {user.totalTicketsEarned}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => blockUser(user.id, user.isBlocked)}
                        disabled={loading === user.id}
                      >
                        {user.isBlocked ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" /> Unblock User
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4 mr-2" /> Block User
                          </>
                        )}
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="h-4 w-4 mr-2 text-red-600" /> 
                            <span className="text-red-600">Delete User</span>
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the user
                              account and all associated data including applied tickets.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-600 hover:bg-red-700" 
                              onClick={() => deleteUser(user.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {sortedUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {searchTerm ? (
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-slate-300" />
                      <p className="text-slate-500">No users found matching &quot;{searchTerm}&quot;</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <User className="h-8 w-8 text-slate-300" />
                      <p className="text-slate-500">No users found.</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}; 