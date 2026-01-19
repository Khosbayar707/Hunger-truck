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
import { Card, Heading, Text } from "@radix-ui/themes";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
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
    pointRadius: 4,
    borderWidth: 2,
  }));

  return (
    <Card size="3" style={{ height: 360 }}>
      <div className="mb-4">
        <Heading size="4">Hunger over time</Heading>
        <Text size="2" color="gray">
          Hourly hunger levels across days
        </Text>
      </div>

      <div className="h-[260px]">
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
            plugins: {
              legend: {
                position: "bottom",
              },
            },
          }}
        />
      </div>
    </Card>
  );
}
