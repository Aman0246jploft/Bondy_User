"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useState } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip
);

export default function RevenueChart() {
  const [type, setType] = useState("gross");

  const data = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
    ],
    datasets: [
      {
        data: [150, 60, 120, 260, 180, 100, 330, 200, 280, 380],
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.45,
        borderColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) return;

          const gradient = ctx.createLinearGradient(
            chartArea.left,
            0,
            chartArea.right,
            0
          );

          gradient.addColorStop(0.3075, "#36E1B9");
          gradient.addColorStop(0.9217, "#A29BFE");

          return gradient;
        },
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        ticks: { color: "#22c1b5" },
        grid: { display: false },
      },
      y: {
        ticks: { color: "#22c1b5", stepSize: 100 },
        grid: {
          color: "rgba(255,255,255,0.08)",
          borderDash: [6, 6],
        },
      },
    },
  };

  return (
    <div className="revenuechart analytics-chart">
      <div className="chart-card">
        {/* Header */}
        <div className="chart-header">
          <h4 className="me-auto">Total Revenue</h4>

          <div className="toggle">
            <button
              className={type === "gross" ? "active" : ""}
              onClick={() => setType("gross")}
            >
              Gross Revenue
            </button>
            <button
              className={type === "net" ? "active" : ""}
              onClick={() => setType("net")}
            >
              Net Revenue
            </button>
          </div>

          <select className="range">
            <option>Last 7 days</option>
          </select>
        </div>

        {/* Chart */}
        <div className="chart-body">
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  );
}
