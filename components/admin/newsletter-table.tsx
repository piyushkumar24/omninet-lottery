"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search,
  Calendar,
  Mail,
  Ticket,
  User
} from "lucide-react";

interface Subscriber {
  id: string;
  name: string;
  email: string;
  subscribedAt: Date;
  joinedAt: Date;
  ticketCount: number;
}

interface NewsletterTableProps {
  subscribers: Subscriber[];
}

export const NewsletterTable = ({ subscribers }: NewsletterTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "email" | "subscribedAt" | "joinedAt" | "ticketCount">("subscribedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter subscribers based on search term
  const filteredSubscribers = subscribers.filter(subscriber =>
    subscriber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscriber.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort filtered subscribers
  const sortedSubscribers = [...filteredSubscribers].sort((a, b) => {
    let aValue: any = a[sortBy];
    let bValue: any = b[sortBy];

    if (sortBy === "subscribedAt" || sortBy === "joinedAt") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
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

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex items-center space-x-4">
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
            {sortedSubscribers.length} subscriber{sortedSubscribers.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
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
              <TableHead 
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort("subscribedAt")}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Subscribed Date {getSortIcon("subscribedAt")}
                </div>
              </TableHead>
              <TableHead>Joined Platform</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort("ticketCount")}
              >
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  Applied Tickets {getSortIcon("ticketCount")}
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSubscribers.map((subscriber) => (
              <TableRow key={subscriber.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                      {subscriber.name.charAt(0).toUpperCase()}
                    </div>
                    {subscriber.name}
                  </div>
                </TableCell>
                <TableCell className="text-slate-600">
                  {subscriber.email}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {formatDate(new Date(subscriber.subscribedAt), 'dateOnly')}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(subscriber.subscribedAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">
                    {formatDate(new Date(subscriber.joinedAt), 'dateOnly')}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {subscriber.ticketCount} tickets
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <Mail className="h-3 w-3 mr-1" />
                    Subscribed
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {sortedSubscribers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {searchTerm ? (
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-slate-300" />
                      <p className="text-slate-500">No subscribers found matching &quot;{searchTerm}&quot;</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Mail className="h-8 w-8 text-slate-300" />
                      <p className="text-slate-500">No newsletter subscribers yet</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      {sortedSubscribers.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="font-medium text-slate-700">Total Subscribers</p>
              <p className="text-2xl font-bold text-indigo-600">{sortedSubscribers.length}</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-700">Total Applied Tickets</p>
              <p className="text-2xl font-bold text-green-600">
                {sortedSubscribers.reduce((sum, sub) => sum + sub.ticketCount, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-700">Avg. Tickets per Subscriber</p>
              <p className="text-2xl font-bold text-purple-600">
                {(sortedSubscribers.reduce((sum, sub) => sum + sub.ticketCount, 0) / sortedSubscribers.length).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 