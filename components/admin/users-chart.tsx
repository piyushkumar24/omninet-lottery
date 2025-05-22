"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export const UsersChart = () => {
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

    // Sample data - in a real app this would come from an API
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data = [12, 19, 15, 27, 32, 39, 42, 50, 57, 65, 73, 81];
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(99, 102, 241, 0.5)");
    gradient.addColorStop(1, "rgba(99, 102, 241, 0.0)");

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "User Registrations",
            data,
            borderColor: "rgba(99, 102, 241, 1)",
            backgroundColor: gradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "rgba(99, 102, 241, 1)",
            pointBorderColor: "#fff",
            pointRadius: 4,
            pointHoverRadius: 6,
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
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            titleColor: "#334155",
            bodyColor: "#334155",
            borderColor: "rgba(226, 232, 240, 1)",
            borderWidth: 1,
            padding: 10,
            boxPadding: 4,
            usePointStyle: true,
            titleFont: {
              size: 12,
              weight: "bold",
            },
            bodyFont: {
              size: 12,
            },
            callbacks: {
              label: function(context) {
                return `Users: ${context.raw}`;
              }
            }
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 10,
              },
              color: "#94a3b8",
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(226, 232, 240, 0.5)",
            },
            border: {
              dash: [4, 4],
            },
            ticks: {
              font: {
                size: 10,
              },
              color: "#94a3b8",
              padding: 8,
              precision: 0,
              stepSize: 20,
            },
          },
        },
        interaction: {
          mode: "nearest",
          axis: "x",
          intersect: false,
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div className="h-[300px] w-full">
      <canvas ref={chartRef} />
    </div>
  );
}; 