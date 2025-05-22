"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
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
import { Check, X, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Draw {
  id: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  ticketCount: number;
  prizeAmount: number;
  claimed: boolean;
  drawDate: Date;
  createdAt: Date;
}

interface DrawLogsTableProps {
  draws: Draw[];
}

export function DrawLogsTable({ draws }: DrawLogsTableProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const sendReminderEmail = async (winnerId: string, email: string) => {
    try {
      setLoading(winnerId);
      
      // In a real implementation, we would call an API to send an email
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      
      toast.success(`Reminder sent to ${email}`);
    } catch (error) {
      toast.error("Failed to send reminder");
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const markAsClaimed = async (winnerId: string) => {
    try {
      setLoading(winnerId);
      
      // In a real implementation, we would call an API to update the claimed status
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      
      toast.success("Prize marked as claimed");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update prize status");
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Winner</TableHead>
            <TableHead>Draw Date</TableHead>
            <TableHead>Ticket Count</TableHead>
            <TableHead>Prize Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {draws.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                No draws have been completed yet.
              </TableCell>
            </TableRow>
          )}
          {draws.map((draw) => (
            <TableRow key={draw.id}>
              <TableCell className="font-medium">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    {draw.userImage ? (
                      <AvatarImage src={draw.userImage} />
                    ) : (
                      <AvatarFallback className="bg-indigo-100 text-indigo-800">
                        {draw.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{draw.userName}</p>
                    <p className="text-xs text-slate-500">{draw.userEmail}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {format(new Date(draw.drawDate), "PPP")}
                <p className="text-xs text-slate-500">
                  {format(new Date(draw.drawDate), "p")}
                </p>
              </TableCell>
              <TableCell>{draw.ticketCount}</TableCell>
              <TableCell>${draw.prizeAmount.toFixed(2)}</TableCell>
              <TableCell>
                {draw.claimed ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Claimed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-300 text-amber-600">
                    <X className="h-3.5 w-3.5 mr-1" />
                    Unclaimed
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right space-x-2">
                {!draw.claimed && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendReminderEmail(draw.id, draw.userEmail)}
                      disabled={loading === draw.id}
                    >
                      <Mail className="h-4 w-4 mr-1" /> Remind
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => markAsClaimed(draw.id)}
                      disabled={loading === draw.id}
                    >
                      <Check className="h-4 w-4 mr-1" /> Mark Claimed
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 