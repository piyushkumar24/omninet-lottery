"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface PlatformMetricsProps {
  surveyTickets: number;
  referralTickets: number;
  socialTickets: number;
}

export const PlatformMetrics = ({
  surveyTickets,
  referralTickets,
  socialTickets,
}: PlatformMetricsProps) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Survey", "Referral", "Social"],
        datasets: [
          {
            data: [surveyTickets, referralTickets, socialTickets],
            backgroundColor: [
              "rgba(99, 102, 241, 0.7)",
              "rgba(14, 165, 233, 0.7)",
              "rgba(249, 115, 22, 0.7)",
            ],
            borderColor: [
              "rgba(99, 102, 241, 1)",
              "rgba(14, 165, 233, 1)",
              "rgba(249, 115, 22, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.raw as number;
                const total = [surveyTickets, referralTickets, socialTickets].reduce(
                  (a, b) => a + b,
                  0
                );
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [surveyTickets, referralTickets, socialTickets]);

  return (
    <div className="h-[300px] w-full flex items-center justify-center">
      <canvas ref={chartRef} />
    </div>
  );
}; 