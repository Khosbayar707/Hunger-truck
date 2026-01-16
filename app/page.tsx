"use client";

import { Container, Typography, Stack } from "@mui/material";
import { useState } from "react";
import HourPicker, { HungerLevel } from "./components/HourPicker";
import HungerChart from "./components/HungerChart";

export default function Home() {
  const [data, setData] = useState({});

  function handleSelect(hour: number, value: HungerLevel) {
    console.log("Saved:", { hour, value });
    // later: update store + chart
  }

  return (
    <Container maxWidth="md">
      <Stack spacing={4} sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight={600}>
          Hunger Truck 🍽️
        </Typography>

        <HungerChart data={data} />
        <HourPicker onSelect={handleSelect} />
      </Stack>
    </Container>
  );
}
