"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, X, CheckCircle, Gift, Users, Share2, ClipboardCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TicketNotificationProps {
  show: boolean;
  ticketSource: "SURVEY" | "SOCIAL" | "REFERRAL";
  ticketCount?: number;
  onClose: () => void;
  onViewDashboard?: () => void;
}

const getSourceConfig = (source: "SURVEY" | "SOCIAL" | "REFERRAL") => {
  switch (source) {
    case "SURVEY":
      return {
        icon: ClipboardCheck,
        title: "Survey Completed!",
        description: "completed a survey",
        color: "bg-blue-500",
        bgColor: "bg-gradient-to-r from-blue-50 to-indigo-50",
        borderColor: "border-blue-200",
        emoji: "🎯"
      };
    case "SOCIAL":
      return {
        icon: Share2,
        title: "Social Media Followed!",
        description: "followed us on social media",
        color: "bg-purple-500",
        bgColor: "bg-gradient-to-r from-purple-50 to-pink-50",
        borderColor: "border-purple-200",
        emoji: "📱"
      };
    case "REFERRAL":
      return {
        icon: Users,
        title: "Referral Bonus!",
        description: "earned a referral bonus",
        color: "bg-green-500",
        bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
        borderColor: "border-green-200",
        emoji: "🤝"
      };
  }
};

export const TicketNotification = ({
  show,
  ticketSource,
  ticketCount = 1,
  onClose,
  onViewDashboard
}: TicketNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const config = getSourceConfig(ticketSource);
  const IconComponent = config.icon;

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.5 
          }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <Card className={`${config.bgColor} ${config.borderColor} border-2 shadow-2xl overflow-hidden`}>
            <CardContent className="p-0">
              {/* Header with close button */}
              <div className="flex justify-between items-start p-4 pb-2">
                <div className="flex items-center gap-3">
                  <motion.div 
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className={`p-2 ${config.color} rounded-full text-white`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">
                      {config.emoji} {config.title}
                    </h3>
                    <p className="text-sm text-slate-600">
                      You {config.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8 text-slate-500 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Ticket award section */}
              <div className="px-4 pb-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  className="bg-white/80 rounded-xl p-4 border border-white/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-slate-800">
                        {ticketCount} Lottery Ticket{ticketCount !== 1 ? 's' : ''} Awarded!
                      </span>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Applied
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-3">
                    Your ticket{ticketCount !== 1 ? 's' : ''} {ticketCount === 1 ? 'has' : 'have'} been automatically applied to this week's lottery draw. Good luck! 🍀
                  </p>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={onViewDashboard}
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      View Dashboard
                    </Button>
                    <Button
                      onClick={handleClose}
                      variant="outline"
                      size="sm"
                      className="border-slate-300 text-slate-600 hover:bg-slate-50"
                    >
                      Dismiss
                    </Button>
                  </div>
                </motion.div>
              </div>

              {/* Progress bar animation */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 8, ease: "linear" }}
                className="h-1 bg-blue-500/30"
              />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 