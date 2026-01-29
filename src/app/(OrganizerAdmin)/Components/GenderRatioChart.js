"use client";

import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

function GenderRatioChart() {
  const options = {
    chart: {
      type: "bar",
      background: "#2b2b2b",
      toolbar: { show: false },
    },
    theme: {
      mode: "dark",
    },
    plotOptions: {
      bar: {
        borderRadius: 2,
        columnWidth: "45%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      borderColor: "#444",
      strokeDashArray: 4,
    },
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
      labels: {
        style: {
          colors: "#9ca3af",
        },
      },
      axisBorder: {
        color: "#444",
      },
      axisTicks: {
        color: "#444",
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#9ca3af",
        },
      },
    },
    legend: {
      position: "bottom",
      labels: {
        colors: "#e5e7eb",
      },
      markers: {
        radius: 12,
      },
    },
    colors: ["#2dd4bf", "#0f766e"], // Male / Female
  };

  const series = [
    {
      name: "Male",
      data: [850, 760, 780, 800, 700, 720, 920, 350],
    },
    {
      name: "Female",
      data: [740, 900, 650, 600, 580, 940, 560, 300],
    },
  ];
  return (
    <div>
      <div className="analytics-chart gender-ratio">
        <h4>Gender ratio</h4>
        <Chart options={options} series={series} type="bar" height={320} />
      </div>
    </div>
  );
}

export default GenderRatioChart;
