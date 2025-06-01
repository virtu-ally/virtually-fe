import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Progress = ({
  setActiveTab,
}: {
  setActiveTab: (tab: string) => void;
}) => {
  // Mock data
  const mockData = {
    labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`), // Days of month
    datasets: [
      {
        label: "Daily Goal Completions",
        data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 5)), // Random completions 0-4
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Daily Goal Completions This Month",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="progress-container">
      <h2>Progress Tracker</h2>
      <div className="tasks-list">
        <h3>Today's Tasks</h3>
        <ul>
          <li>Complete morning meditation</li>
          <li>Read for 30 minutes</li>
          <li>Exercise for 20 minutes</li>
        </ul>
      </div>
      <div className="chart-container">
        <Line data={mockData} options={options} />
      </div>
    </div>
  );
};

export default Progress;
