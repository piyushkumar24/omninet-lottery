"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { formatDate } from "@/lib/utils";

Chart.register(...registerables);

interface TicketsChartProps {
  ticketsData: {
    createdAt: Date;
    _count: {
      id: number;
    };
  }[];
}

export function TicketsChart({ ticketsData }: TicketsChartProps) {
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

    // Process data for chart
    const labels = ticketsData.map((entry) => {
      const date = new Date(entry.createdAt);
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      });
    });
    
    const data = ticketsData.map((entry) => entry._count.id);

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Tickets Generated",
            data,
            borderColor: "rgba(99, 102, 241, 1)",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
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
  }, [ticketsData]);

  return (
    <div className="h-full w-full">
      <canvas ref={chartRef} />
    </div>
  );
} 