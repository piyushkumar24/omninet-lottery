"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DollarSign, Edit3, Loader2 } from "lucide-react";

interface PrizeAmountManagerProps {
  currentAmount: number;
}

export const PrizeAmountManager = ({ currentAmount }: PrizeAmountManagerProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [newAmount, setNewAmount] = useState(currentAmount.toString());
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateAmount = async () => {
    const amount = parseFloat(newAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    if (amount > 10000) {
      toast.error("Prize amount cannot exceed $10,000");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "default_prize_amount",
          value: amount.toString(),
          description: "Default prize amount for weekly lottery draws"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update prize amount");
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Prize amount updated to $${amount}. New draws will use this amount.`);
        setIsOpen(false);
        router.refresh();
      } else {
        throw new Error(data.message || "Failed to update prize amount");
      }
    } catch (error) {
      console.error("Error updating prize amount:", error);
      toast.error("Failed to update prize amount. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setNewAmount(currentAmount.toString());
    setIsOpen(false);
  };

  return (
    <div className="flex items-center mt-2">
      <div className="border rounded-md px-3 py-2 w-40 bg-white">
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 text-slate-500 mr-1" />
          <span className="font-medium">{currentAmount.toFixed(2)}</span>
        </div>
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="ml-2">
            <Edit3 className="h-4 w-4 mr-1" />
            Change
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Prize Amount</DialogTitle>
            <DialogDescription>
              Set the default prize amount for new lottery draws. This will not affect ongoing draws.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <div className="col-span-3 relative">
                <DollarSign className="h-4 w-4 absolute top-1/2 transform -translate-y-1/2 left-3 text-slate-500" />
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  max="10000"
                  step="0.01"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="pl-8"
                  placeholder="Enter amount"
                />
              </div>
            </div>
            <div className="text-sm text-slate-500 space-y-1">
              <p>• Minimum: $1.00</p>
              <p>• Maximum: $10,000.00</p>
              <p>• Current draws will not be affected</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAmount} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Amount"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 