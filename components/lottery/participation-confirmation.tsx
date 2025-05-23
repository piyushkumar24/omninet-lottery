"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Ticket, 
  AlertTriangle, 
  Clock, 
  Calendar,
  DollarSign,
  Users
} from "lucide-react";

interface ParticipationConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  ticketsToUse: number;
  availableTickets: number;
  drawDate: Date;
  prizeAmount: number;
  isLoading: boolean;
  isExistingParticipation?: boolean;
  currentTicketsInDraw?: number;
}

export const ParticipationConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  ticketsToUse,
  availableTickets,
  drawDate,
  prizeAmount,
  isLoading,
  isExistingParticipation = false,
  currentTicketsInDraw = 0,
}: ParticipationConfirmationProps) => {
  const remainingTickets = availableTickets - ticketsToUse;
  const newTotalTickets = isExistingParticipation ? currentTicketsInDraw + ticketsToUse : ticketsToUse;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 shadow-2xl">
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <Ticket className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <DialogTitle className="text-2xl font-bold text-slate-800">
            {isExistingParticipation ? "Add More Tickets?" : "Confirm Lottery Participation"}
          </DialogTitle>
          
          <DialogDescription className="text-slate-600 text-base leading-relaxed">
            {isExistingParticipation 
              ? `You&apos;re about to add ${ticketsToUse} more tickets to your existing participation in this lottery draw.`
              : `You&apos;re about to participate in the upcoming lottery draw with ${ticketsToUse} ticket${ticketsToUse > 1 ? 's' : ''}.`
            }
            <br />
            <span className="font-semibold text-red-600">
              Once tickets are used, they cannot be recovered!
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Participation Summary */}
          <div className="bg-white rounded-xl border border-blue-200 p-4 space-y-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Ticket className="h-5 w-5 text-blue-600" />
              Participation Summary
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Tickets to use:</span>
                  <span className="font-semibold text-blue-600">{ticketsToUse}</span>
                </div>
                
                {isExistingParticipation && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Current in draw:</span>
                    <span className="font-semibold text-green-600">{currentTicketsInDraw}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    {isExistingParticipation ? "New total in draw:" : "Total in draw:"}
                  </span>
                  <span className="font-bold text-indigo-600">{newTotalTickets}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Available tickets:</span>
                  <span className="font-semibold text-slate-800">{availableTickets}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-600">Remaining after:</span>
                  <span className={`font-semibold ${remainingTickets === 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {remainingTickets}
                  </span>
                </div>
                
                {remainingTickets === 0 && (
                  <div className="text-xs text-red-600 bg-red-50 rounded p-2 mt-2">
                    ⚠️ This will use all your tickets!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Draw Information */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-4 space-y-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Draw Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                <span className="text-slate-600">Draw Date:</span>
              </div>
              <span className="font-semibold text-slate-800">
                {drawDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-slate-600">Prize:</span>
              </div>
              <span className="font-bold text-green-600">${prizeAmount} Gift Card</span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-orange-800 mb-1">Important Notice</p>
                <p className="text-orange-700 leading-relaxed">
                  Tickets used for lottery participation are non-refundable and cannot be retrieved. 
                  Make sure you&apos;re comfortable with the number of tickets you&apos;re using.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </Button>
          
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                {isExistingParticipation ? "Add Tickets" : "Confirm Participation"}
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 