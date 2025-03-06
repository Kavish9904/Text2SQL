import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type ChartType = "line" | "bar" | "pie";

interface ChartViewProps {
  type: ChartType;
  data: Record<string, unknown>[];
  xAxis: string;
  yAxis: string;
}

export function ChartView({
  type,
  data,
  xAxis,
  yAxis,
}: ChartViewProps): JSX.Element {
  const chartData = {
    labels: data.map((item) => String(item[xAxis])),
    datasets: [
      {
        label: yAxis,
        data: data.map((item) => Number(item[yAxis])),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor:
          type === "pie"
            ? data.map(
                () =>
                  `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(
                    Math.random() * 255
                  )}, ${Math.floor(Math.random() * 255)})`
              )
            : "rgba(75, 192, 192, 0.5)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `${yAxis} by ${xAxis}`,
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      y: {
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      options: {
        ...options,
        plugins: {
          ...options.plugins,
          legend: {
            ...options.plugins.legend,
            labels: {
              color: "#000000",
            },
          },
        },
      },
    };

    switch (type) {
      case "line":
        return <Line {...commonProps} />;
      case "bar":
        return <Bar {...commonProps} />;
      case "pie":
        return <Pie {...commonProps} />;
      default:
        return null;
    }
  };

  return <div className="w-full h-[400px] p-4 bg-white">{renderChart()}</div>;
}
