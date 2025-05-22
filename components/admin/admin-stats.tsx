"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Ticket, Gift } from "lucide-react";

interface AdminStatsProps {
  totalUsers: number;
  activeUsers: number;
  totalTickets: number;
  unusedTickets: number;
  totalWinners: number;
  unclaimedPrizes: number;
}

export const AdminStats = ({
  totalUsers,
  activeUsers,
  totalTickets,
  unusedTickets,
  totalWinners,
  unclaimedPrizes,
}: AdminStatsProps) => {
  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-100 p-2 rounded-full">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Users</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold">{totalUsers}</h3>
                <span className="text-xs text-green-600">{activeUsers} active</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-100 p-2 rounded-full">
              <Ticket className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Tickets</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold">{totalTickets}</h3>
                <span className="text-xs text-green-600">{unusedTickets} unused</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-100 p-2 rounded-full">
              <Gift className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Winners</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold">{totalWinners}</h3>
                <span className="text-xs text-yellow-600">{unclaimedPrizes} unclaimed</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}; 