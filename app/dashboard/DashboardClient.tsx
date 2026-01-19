"use client";

import { supabase } from "@/lib/supabase";
import { HungerLevel } from "../components/hunger/HourPicker";
import { Card } from "../components/ui/card";
import HungerChart, { HungerData } from "../components/hunger/HungerChart";
import { useEffect, useState } from "react";

type HungerLogRow = {
  level: HungerLevel;
  loggedAt: string;
};

export default function DashboardClient() {
  const [data, setData] = useState<HungerData>({});
  const [loading, setLoading] = useState(true);

  function applyLog(
    prev: HungerData,
    loggedAt: string,
    level: number,
  ): HungerData {
    const date = new Date(loggedAt);
    const day = date.toISOString().slice(0, 10);
    const hour = date.getHours();

    return {
      ...prev,
      [day]: {
        ...(prev[day] ?? {}),
        [hour]: level,
      },
    };
  }

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      const { data: logs, error } = await supabase
        .from("HungerLog")
        .select("level, loggedAt")
        .order("loggedAt", { ascending: true });

      if (!active) return;

      if (error) {
        console.error("Failed to load hunger logs", error);
        setLoading(false);
        return;
      }

      if (!logs) {
        setData({});
        setLoading(false);
        return;
      }

      let transformed: HungerData = {};

      for (const log of logs) {
        transformed = applyLog(transformed, log.loggedAt, log.level);
      }

      setData(transformed);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel("hunger-log-inserts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "HungerLog",
        },
        (payload) => {
          const { loggedAt, level } = payload.new as {
            loggedAt: string;
            level: number;
          };

          setData((prev) => applyLog(prev, loggedAt, level));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="p-6">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <HungerChart data={data} />
      )}
    </Card>
  );
}
