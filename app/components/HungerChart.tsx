"use client";

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Paper, Typography } from "@mui/material";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

export type HungerData = {
  [day: string]: {
    [hour: number]: number;
  };
};

type HungerChartProps = {
  data?: HungerData;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function HungerChart({ data = {} }: HungerChartProps) {
  const datasets = Object.entries(data).map(([day, values]) => ({
    label: day,
    data: HOURS.map((h) => values[h] ?? null),
    tension: 0.4,
    spanGaps: true,
    pointRadius: 5,
    borderWidth: 2,
  }));

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Hunger over time
      </Typography>

      <Line
        data={{
          labels: HOURS,
          datasets,
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: 0,
              max: 10,
              ticks: { stepSize: 2 },
              title: {
                display: true,
                text: "Hunger level",
              },
            },
            x: {
              title: {
                display: true,
                text: "Hour of day",
              },
            },
          },
        }}
        height={300}
      />
    </Paper>
  );
}
