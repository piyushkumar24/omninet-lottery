"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  User, 
  Mail, 
  Ticket,
  CheckCircle,
  Loader2,
  PartyPopper,
  X,
  Trophy,
  Check,
  AlertTriangle
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface Participant {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  ticketsUsed: number;
  participatedAt: Date;
}

interface ManualWinnerSelectProps {
  canRunDraw: boolean;
  participants: Participant[];
  drawDate: Date;
  prizeAmount: number;
}

export function ManualWinnerSelect({ 
  canRunDraw, 
  participants,
  drawDate,
  prizeAmount
}: ManualWinnerSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Participant | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  // Filter out participants with 0 tickets
  const activeParticipants = participants.filter(p => p.ticketsUsed > 0);

  const filteredParticipants = searchQuery 
    ? activeParticipants.filter(p => 
        (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : activeParticipants;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectUser = (user: Participant) => {
    setSelectedUser(user);
    setShowConfirmDialog(true);
  };

  const handleConfirmSelection = async () => {
    if (!selectedUser) return;
    
    setIsSelecting(true);
    
    try {
      // Ensure we're sending the user ID as a string to avoid type mismatches
      const userId = typeof selectedUser.id === 'string' ? selectedUser.id : String(selectedUser.id);
      
      console.log(`Selecting winner with user ID: ${userId}`);
      
      const response = await fetch("/api/admin/draws/select-winner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowConfirmDialog(false);
        setShowSuccess(true);
        toast.success("Winner selected successfully!");
      } else {
        toast.error(data.message || "Failed to select winner");
        setShowConfirmDialog(false);
      }
    } catch (error) {
      console.error("Error selecting winner:", error);
      toast.error("An error occurred while selecting the winner");
      setShowConfirmDialog(false);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setSelectedUser(null);
    router.refresh();
  };

  // Check if we have any active participants with tickets
  const hasActiveParticipants = activeParticipants.length > 0;
  // Update canRunDraw based on whether there are active participants
  const canActuallyRunDraw = canRunDraw && hasActiveParticipants;

  return (
    <Card className="mt-6 border-2 border-indigo-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-indigo-600" />
          <CardTitle>Manual Winner Selection</CardTitle>
        </div>
        <CardDescription>
          Select a specific participant to be the winner of the current lottery draw
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!canActuallyRunDraw ? (
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-800">Cannot Select Winner</h3>
              <p className="text-sm text-orange-700 mt-1">
                {!hasActiveParticipants 
                  ? "No users with active tickets found. At least 1 user must have active tickets to run the draw."
                  : "At least 1 user must participate in the lottery before a winner can be selected."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by name or email"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10"
                  disabled={!canActuallyRunDraw}
                />
              </div>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-12 bg-slate-50 p-3 text-sm font-medium text-slate-600">
                <div className="col-span-5">User</div>
                <div className="col-span-3">Participation Date</div>
                <div className="col-span-2">Tickets</div>
                <div className="col-span-2 text-right">Action</div>
              </div>

              <div className="max-h-96 overflow-auto">
                {filteredParticipants.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    {searchQuery 
                      ? "No participants match your search" 
                      : "No participants with active tickets found for this draw"}
                  </div>
                ) : (
                  filteredParticipants.map((participant) => (
                    <div 
                      key={participant.id}
                      className="grid grid-cols-12 p-3 items-center border-t hover:bg-slate-50 transition-colors"
                    >
                      <div className="col-span-5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {participant.image ? (
                              <AvatarImage src={participant.image} />
                            ) : (
                              <AvatarFallback className="bg-indigo-100 text-indigo-800">
                                {participant.name?.charAt(0).toUpperCase() || "U"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-800">
                              {participant.name || "Anonymous User"}
                            </p>
                            <p className="text-xs text-slate-500">{participant.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3 text-sm text-slate-600">
                        {formatDate(new Date(participant.participatedAt), 'short')}
                      </div>
                      <div className="col-span-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Ticket className="w-3 h-3 mr-1" /> {participant.ticketsUsed}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSelectUser(participant)}
                          className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                        >
                          <Check className="w-3 h-3 mr-1" /> Select
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
        
        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Winner Selection</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3 bg-indigo-50 rounded-lg">
                  <Avatar className="h-12 w-12">
                    {selectedUser.image ? (
                      <AvatarImage src={selectedUser.image} />
                    ) : (
                      <AvatarFallback className="bg-indigo-200 text-indigo-800 text-lg">
                        {selectedUser.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium text-indigo-900">{selectedUser.name || "Anonymous User"}</p>
                    <p className="text-sm text-indigo-700">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-indigo-100 border-indigo-200 text-indigo-800">
                        <Ticket className="w-3 h-3 mr-1" /> {selectedUser.ticketsUsed} tickets
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-center py-2 px-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    This user will be awarded <span className="font-bold">${prizeAmount}</span> as the lottery winner.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter className="flex space-x-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={isSelecting}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={handleConfirmSelection}
                disabled={isSelecting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSelecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Selecting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Selection
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-700">
                <PartyPopper className="h-5 w-5 text-green-600" />
                Winner Selected!
              </DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-lg font-medium text-center">
                    {selectedUser.name || selectedUser.email || "The user"} has been selected as the winner!
                  </p>
                  <p className="text-sm text-gray-500 text-center mt-1">
                    They will be notified via email about their prize.
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                type="button"
                onClick={handleCloseSuccess}
                className="bg-green-600 hover:bg-green-700 text-white w-full"
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 