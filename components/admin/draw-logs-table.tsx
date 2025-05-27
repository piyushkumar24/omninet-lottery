"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
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
import { 
  Check, 
  X, 
  Mail, 
  Gift, 
  Ticket,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [selectedDraw, setSelectedDraw] = useState<Draw | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [isProcessingClaim, setIsProcessingClaim] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

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

  const openClaimDialog = (draw: Draw) => {
    setSelectedDraw(draw);
    setCouponCode("");
    setCouponError(null);
    setShowClaimDialog(true);
  };

  const handleProcessClaim = async () => {
    if (!selectedDraw) return;
    
    // Validate coupon code
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setIsProcessingClaim(true);
    setCouponError(null);
    
    try {
      const response = await fetch("/api/admin/winners/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          winnerId: selectedDraw.id,
          couponCode: couponCode.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Prize claimed successfully! Winner has been notified.");
        setShowClaimDialog(false);
        router.refresh();
      } else {
        setCouponError(data.message || "Failed to process claim");
        toast.error(data.message || "Failed to process claim");
      }
    } catch (error) {
      console.error("Error processing claim:", error);
      setCouponError("An unexpected error occurred");
      toast.error("An error occurred while processing the claim");
    } finally {
      setIsProcessingClaim(false);
    }
  };

  return (
    <>
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
                  {formatDate(new Date(draw.drawDate), 'dateOnly')}
                  <p className="text-xs text-slate-500">
                    {new Date(draw.drawDate).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'UTC'
                    })}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Ticket className="h-3.5 w-3.5 mr-1 text-blue-500" />
                    {draw.ticketCount}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-green-700">${draw.prizeAmount.toFixed(2)}</TableCell>
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
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Mail className="h-4 w-4 mr-1" /> Remind
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openClaimDialog(draw)}
                        disabled={loading === draw.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Gift className="h-4 w-4 mr-1" /> Issue Prize
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Claim Prize Dialog */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Prize to Winner</DialogTitle>
            <DialogDescription>
              Enter the coupon code for the Amazon gift card. An email with this code will be sent to the winner.
            </DialogDescription>
          </DialogHeader>
          
          {selectedDraw && (
            <div className="py-4">
              <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <Avatar className="h-12 w-12">
                  {selectedDraw.userImage ? (
                    <AvatarImage src={selectedDraw.userImage} />
                  ) : (
                    <AvatarFallback className="bg-blue-100 text-blue-800 text-lg">
                      {selectedDraw.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-semibold text-slate-800">{selectedDraw.userName}</h3>
                  <p className="text-sm text-slate-600">{selectedDraw.userEmail}</p>
                  <p className="text-xs text-green-600 mt-1">
                    Prize Amount: ${selectedDraw.prizeAmount.toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="couponCode">Amazon Gift Card Coupon Code</Label>
                  <Input
                    id="couponCode"
                    placeholder="e.g. AMZN-1234-5678-9ABC"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="font-mono"
                  />
                  {couponError && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {couponError}
                    </p>
                  )}
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-700 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>
                      This will mark the prize as claimed and send an email notification 
                      to the winner with the coupon code and redemption instructions.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowClaimDialog(false)}
              disabled={isProcessingClaim}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleProcessClaim}
              disabled={isProcessingClaim}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessingClaim ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Issue Prize & Notify
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 