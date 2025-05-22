import { Ticket } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface TicketStatsProps {
  tickets: number;
  winningChance: string;
}

export const TicketStats = ({ tickets, winningChance }: TicketStatsProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <h3 className="text-sm font-medium">Your Tickets</h3>
        <Ticket className="w-4 h-4 text-indigo-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{tickets}</div>
        <p className="text-xs text-muted-foreground">
          Winning chance: {winningChance}%
        </p>
      </CardContent>
    </Card>
  );
}; 