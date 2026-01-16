"use client";

import { Stack, IconButton, Typography } from "@mui/material";

export type HungerLevel = 2 | 4 | 6 | 8 | 10;

const levels: { v: HungerLevel; e: string }[] = [
  { v: 2, e: "😄" },
  { v: 4, e: "🙂" },
  { v: 6, e: "😐" },
  { v: 8, e: "😟" },
  { v: 10, e: "😫" },
];

type HourPickerProps = {
  onSelect: (hour: number, value: HungerLevel) => void;
};

export default function HourPicker({ onSelect }: HourPickerProps) {
  const hour = new Date().getHours();

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">
        How hungry are you at {hour}:00?
      </Typography>

      <Stack direction="row" spacing={1}>
        {levels.map((l) => (
          <IconButton
            key={l.v}
            onClick={() => onSelect(hour, l.v)}
            sx={{ fontSize: 28 }}
          >
            {l.e}
          </IconButton>
        ))}
      </Stack>
    </Stack>
  );
}
