"use client";

import { LotteryParticipation } from "./lottery-participation";
import { useRouter } from "next/navigation";

interface LotteryParticipationWrapperProps {
  appliedTickets: number;
  draw: {
    id: string;
    drawDate: string;
    prizeAmount: number;
    totalTickets: number;
    participants: any[];
  };
  userParticipation?: {
    ticketsUsed: number;
  } | null;
}

export const LotteryParticipationWrapper = (props: LotteryParticipationWrapperProps) => {
  const router = useRouter();

  const handleParticipationUpdate = () => {
    // Use router.refresh() for better UX
    router.refresh();
  };

  return (
    <LotteryParticipation
      {...props}
      onParticipationUpdate={handleParticipationUpdate}
    />
  );
}; 