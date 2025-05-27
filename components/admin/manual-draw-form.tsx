"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Gift, 
  Trophy, 
  User, 
  Mail, 
  Ticket,
  Loader2,
  X,
  Check,
  PartyPopper
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Winner {
  name: string;
  email: string;
  image: string | null;
  ticketCount: number;
  prizeAmount: number;
}

interface ManualDrawFormProps {
  canRunDraw: boolean;
  participantCount: number;
  totalTicketsInDraw: number;
}

export const ManualDrawForm = ({ 
  canRunDraw, 
  participantCount, 
  totalTicketsInDraw 
}: ManualDrawFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [winner, setWinner] = useState<Winner | null>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!canRunDraw) return;

    setIsLoading(true);
    setIsAnimating(true);
    
    try {
      // Show animation for a minimum time before fetching result
      const animationPromise = new Promise(resolve => setTimeout(resolve, 3000));
      
      const apiPromise = fetch("/api/admin/draws/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }).then(res => res.json());
      
      // Wait for both animation and API call to complete
      const [_, data] = await Promise.all([animationPromise, apiPromise]);

      if (data.success) {
        setWinner(data.winner);
        setShowWinner(true);
        toast.success(`🎉 Draw completed!`);
      } else {
        toast.error(data.message || "Failed to run draw");
        setIsAnimating(false);
      }
    } catch (error) {
      console.error("Error running draw:", error);
      toast.error("An error occurred while running the draw");
      setIsAnimating(false);
    } finally {
      setIsLoading(false);
    }
  };

  const closeWinnerDialog = () => {
    setShowWinner(false);
    setIsAnimating(false);
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Ready to Run Draw?</h3>
          {canRunDraw ? (
            <p className="text-sm text-green-600 mt-1">
              ✅ {participantCount} user{participantCount !== 1 ? 's have' : ' has'} participated with {totalTicketsInDraw} ticket{totalTicketsInDraw !== 1 ? 's' : ''} total
            </p>
          ) : (
            <p className="text-sm text-red-600 mt-1">
              ❌ No users have participated yet. Minimum 1 participant required.
            </p>
          )}
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={!canRunDraw || isLoading}
          className={`flex items-center ${
            canRunDraw 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Gift className="mr-2 h-4 w-4" />
          )}
          {isLoading 
            ? 'Running Draw...' 
            : canRunDraw 
              ? 'Run Draw Now' 
              : 'Waiting for Participants'
          }
        </Button>
      </div>

      {/* Animation Modal */}
      <Dialog open={isAnimating} onOpenChange={(open) => !open && closeWinnerDialog()}>
        <DialogContent className="sm:max-w-md md:max-w-lg bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 p-0 overflow-hidden">
          <div className="relative w-full h-full">
            {!showWinner ? (
              <div className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    {/* Spinning wheel animation */}
                    <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-t-4 border-purple-500 animate-spin" style={{ animationDuration: '2s' }}></div>
                    <div className="absolute inset-4 rounded-full border-t-4 border-green-500 animate-spin" style={{ animationDuration: '1.5s' }}></div>
                    <div className="absolute inset-6 rounded-full border-t-4 border-yellow-500 animate-spin" style={{ animationDuration: '3s' }}></div>
                    <div className="absolute inset-8 rounded-full border-t-4 border-red-500 animate-spin" style={{ animationDuration: '2.5s' }}></div>
                    <div className="bg-white rounded-full p-4 z-10">
                      <Trophy className="h-8 w-8 text-yellow-500" />
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-indigo-800 mb-2">Selecting a Winner...</h2>
                <p className="text-indigo-600">
                  Randomly selecting from {participantCount} participant{participantCount !== 1 ? 's' : ''} 
                  with {totalTicketsInDraw} ticket{totalTicketsInDraw !== 1 ? 's' : ''}
                </p>
                
                {/* Confetti/dots animation */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute w-3 h-3 rounded-full" 
                      style={{
                        backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][i % 5],
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        opacity: 0.7,
                        animation: `float ${2 + Math.random() * 3}s ease-in-out infinite`,
                        animationDelay: `${Math.random() * 2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8">
                {/* Confetti background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute opacity-70" 
                      style={{
                        width: `${5 + Math.random() * 10}px`,
                        height: `${10 + Math.random() * 20}px`,
                        backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][i % 5],
                        left: `${Math.random() * 100}%`,
                        top: `${-10 - Math.random() * 10}%`,
                        transform: `rotate(${Math.random() * 360}deg)`,
                        animation: `fall ${3 + Math.random() * 5}s linear infinite`,
                        animationDelay: `${Math.random() * 5}s`,
                      }}
                    />
                  ))}
                </div>
                
                <div className="text-center relative z-10">
                  <div className="flex justify-center items-center gap-2 mb-4">
                    <PartyPopper className="h-8 w-8 text-blue-500" />
                    <h2 className="text-2xl font-bold text-indigo-800">We Have a Winner!</h2>
                    <PartyPopper className="h-8 w-8 text-purple-500" />
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 border-2 border-indigo-200 mb-6 shadow-lg">
                    <div className="flex flex-col items-center">
                      <div className="mb-4 relative">
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-pulse"></div>
                        <Avatar className="h-24 w-24 border-4 border-white">
                          {winner?.image ? (
                            <AvatarImage src={winner.image} alt={winner.name} />
                          ) : (
                            <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                              {winner?.name?.charAt(0) || "W"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{winner?.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center mb-3">
                        <Mail className="h-4 w-4 mr-1" />
                        {winner?.email}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                          <p className="text-sm text-green-600">Prize Amount</p>
                          <p className="text-2xl font-bold text-green-700">
                            ${winner?.prizeAmount.toFixed(2)}
                          </p>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                          <p className="text-sm text-blue-600">Tickets Used</p>
                          <p className="text-2xl font-bold text-blue-700 flex items-center justify-center">
                            <Ticket className="h-4 w-4 mr-1" />
                            {winner?.ticketCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button onClick={closeWinnerDialog} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                      <Check className="h-4 w-4" />
                      Confirm Winner
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Close button */}
            <button 
              onClick={closeWinnerDialog}
              className="absolute top-4 right-4 p-1 rounded-full bg-white/50 hover:bg-white text-gray-700 hover:text-gray-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-20px) scale(1.2);
          }
        }
        
        @keyframes fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
          }
          100% {
            transform: translateY(500px) rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}; 