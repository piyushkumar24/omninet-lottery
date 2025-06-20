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

  const filteredParticipants = searchQuery 
    ? participants.filter(p => 
        (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : participants;

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
        {!canRunDraw ? (
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-800">Cannot Select Winner</h3>
              <p className="text-sm text-orange-700 mt-1">
                At least 1 user must participate in the lottery before a winner can be selected.
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
                  disabled={!canRunDraw}
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
                      : "No participants found for this draw"}
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
                          <Ticket className="h-3 w-3 mr-1" />
                          {participant.ticketsUsed}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-right">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
                          onClick={() => handleSelectUser(participant)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Select
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
              <div className="py-4">
                <div className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg mb-4">
                  <Avatar className="h-12 w-12">
                    {selectedUser.image ? (
                      <AvatarImage src={selectedUser.image} />
                    ) : (
                      <AvatarFallback className="bg-indigo-100 text-indigo-800 text-lg">
                        {selectedUser.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-slate-800">{selectedUser.name || "Anonymous User"}</h3>
                    <p className="text-sm text-slate-600">{selectedUser.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <p className="text-sm text-slate-600">Tickets Used</p>
                    <p className="text-lg font-bold text-slate-800">{selectedUser.ticketsUsed}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-sm text-green-600">Prize Amount</p>
                    <p className="text-lg font-bold text-green-700">${prizeAmount.toFixed(2)}</p>
                  </div>
                </div>
                
                <p className="text-amber-600 bg-amber-50 p-4 rounded-lg text-sm">
                  <AlertTriangle className="h-4 w-4 inline-block mr-2" />
                  This action will complete the current draw and cannot be reversed.
                  The selected user will be declared the winner.
                </p>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmDialog(false)}
                disabled={isSelecting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmSelection}
                disabled={isSelecting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSelecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirm Selection
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="sm:max-w-md bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <div className="p-6 text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-green-100 rounded-full">
                  <PartyPopper className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">Winner Selected!</h2>
              <p className="text-green-700 mb-6">
                {selectedUser?.name || "The participant"} has been successfully declared as the winner.
              </p>
              
              <Button 
                onClick={handleCloseSuccess}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 