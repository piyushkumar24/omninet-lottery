"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Ticket, Gift } from "lucide-react";

interface StatsCardsProps {
  totalUsers: number;
  activeUsers: number;
  totalTickets: number;
  activeTickets: number;
  totalWinners: number;
  totalPrize: number;
}

export function StatsCards({ 
  totalUsers, 
  activeUsers, 
  totalTickets, 
  activeTickets, 
  totalWinners, 
  totalPrize 
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Users</p>
              <h3 className="text-3xl font-bold mt-1">{totalUsers}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {activeUsers} active in last week
              </p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Tickets</p>
              <h3 className="text-3xl font-bold mt-1">{totalTickets}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {activeTickets} active for next draw
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Ticket className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Winners</p>
              <h3 className="text-3xl font-bold mt-1">{totalWinners}</h3>
              <p className="text-sm text-slate-500 mt-1">
                ${totalPrize} in prizes awarded
              </p>
            </div>
            <div className="bg-amber-100 p-3 rounded-full">
              <Gift className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 