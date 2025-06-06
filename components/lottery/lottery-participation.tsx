"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { ParticipationConfirmation } from "./participation-confirmation";
import { LotteryParticipationSchema } from "@/schemas";
import { participateInLottery } from "@/actions/lottery-participation";
import { 
  Ticket, 
  Plus, 
  Minus, 
  Calendar, 
  DollarSign, 
  Users,
  Clock,
  TrendingUp
} from "lucide-react";

interface LotteryParticipationProps {
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
  onParticipationUpdate: () => void;
}

export const LotteryParticipation = ({
  appliedTickets,
  draw,
  userParticipation,
  onParticipationUpdate,
}: LotteryParticipationProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof LotteryParticipationSchema>>({
    resolver: zodResolver(LotteryParticipationSchema),
    defaultValues: {
      ticketsToUse: 1,
      drawId: draw.id,
    },
  });

  const ticketsToUse = form.watch("ticketsToUse");
  const drawDate = new Date(draw.drawDate);
  const isExistingParticipation = !!userParticipation;

  const updateTickets = (increment: boolean) => {
    const current = form.getValues("ticketsToUse");
    const newValue = increment ? current + 1 : current - 1;
    const maxTickets = Math.min(appliedTickets, 1000);
    
    if (newValue >= 1 && newValue <= maxTickets) {
      form.setValue("ticketsToUse", newValue);
    }
  };

  const handleParticipate = () => {
    setError("");
    setSuccess("");
    
    const values = form.getValues();
    const validation = LotteryParticipationSchema.safeParse(values);
    
    if (!validation.success) {
      setError("Please check your ticket selection.");
      return;
    }
    
    if (values.ticketsToUse > appliedTickets) {
      setError(`You only have ${appliedTickets} tickets available.`);
      return;
    }
    
    setShowConfirmation(true);
  };

  const confirmParticipation = () => {
    startTransition(() => {
      const values = form.getValues();
      
      participateInLottery(values)
        .then((data) => {
          // Handle error response
          if ('error' in data) {
            setError(data.error);
            setShowConfirmation(false);
            return;
          }

          // Handle success response
          if ('success' in data) {
            setSuccess(data.success);
            setShowConfirmation(false);
            form.reset({ ticketsToUse: 1, drawId: draw.id });
            onParticipationUpdate();
            return;
          }
        })
        .catch(() => {
          setError("Something went wrong! Please try again.");
          setShowConfirmation(false);
        });
    });
  };

  if (appliedTickets === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border border-gray-200">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <Ticket className="h-8 w-8 text-gray-500" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Tickets Available</h3>
          <p className="text-gray-600 mb-6">
            You need tickets to participate in the lottery. Earn tickets by completing surveys, 
            referring friends, or sharing on social media.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard/refer">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Users className="h-4 w-4 mr-2" />
                Refer Friends
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {isExistingParticipation ? "This Week's Lottery" : "Join the Upcoming Lottery Draw"}
              </CardTitle>
              <p className="text-blue-100 mt-1">
                {isExistingParticipation 
                  ? `Add more tickets to boost your chances! You're currently participating with ${userParticipation?.ticketsUsed} tickets in the ${drawDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} draw.`
                  : `Participate in the lottery draw on ${drawDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })} and win amazing prizes! Good luck! 🍀`
                }
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          {/* Draw Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">Prize Amount</p>
                <p className="text-2xl font-bold text-green-800">${draw.prizeAmount}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Draw Date</p>
                <p className="text-lg font-bold text-blue-800">
                  {drawDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-700 font-medium">Total Tickets</p>
                <p className="text-2xl font-bold text-purple-800">{draw.totalTickets}</p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleParticipate)} className="space-y-6">
              {/* Ticket Selection */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                <FormField
                  control={form.control}
                  name="ticketsToUse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Ticket className="h-5 w-5 text-blue-600" />
                        Select Number of Tickets
                      </FormLabel>
                      
                      <div className="flex items-center justify-center gap-4 mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateTickets(false)}
                          disabled={field.value <= 1}
                          className="h-12 w-12 rounded-full border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                        >
                          <Minus className="h-5 w-5" />
                        </Button>

                        <div className="flex flex-col items-center gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min={1}
                              max={Math.min(appliedTickets, 1000)}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                const maxValue = Math.min(appliedTickets, 1000);
                                field.onChange(Math.max(1, Math.min(value, maxValue)));
                              }}
                              className="text-center text-2xl font-bold w-24 h-16 border-2 border-blue-200 focus:border-blue-500"
                            />
                          </FormControl>
                          <p className="text-sm text-slate-600">
                            tickets to use
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateTickets(true)}
                          disabled={field.value >= Math.min(appliedTickets, 1000)}
                          className="h-12 w-12 rounded-full border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      <div className="mt-4 text-center">
                        <p className="text-sm text-slate-600">
                          Available tickets: <span className="font-semibold text-blue-600">{appliedTickets}</span>
                        </p>
                        <p className="text-sm text-slate-600">
                          Tickets remaining after: <span className="font-semibold">{appliedTickets - ticketsToUse}</span>
                        </p>
                      </div>
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormError message={error} />
              <FormSuccess message={success} />

              <div className="flex justify-center">
                <Button
                  type="submit"
                  disabled={ticketsToUse > appliedTickets || ticketsToUse < 1}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg min-w-[200px]"
                >
                  <Ticket className="h-5 w-5 mr-2" />
                  {isExistingParticipation ? "Add More Tickets" : "Participate Now"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <ParticipationConfirmation
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={confirmParticipation}
        ticketsToUse={ticketsToUse}
        appliedTickets={appliedTickets}
        drawDate={drawDate}
        prizeAmount={draw.prizeAmount}
        isLoading={isPending}
        isExistingParticipation={isExistingParticipation}
        currentTicketsInDraw={userParticipation?.ticketsUsed || 0}
      />
    </>
  );
}; 