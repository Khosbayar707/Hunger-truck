"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const levels = [
  { value: 1, label: "Starving" },
  { value: 2, label: "Hungry" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Full" },
  { value: 5, label: "Stuffed" },
];

export default function HungerInput() {
  const [level, setLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!level) return;

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("hunger_logs").insert({
      level,
      user_id: user?.id,
    });

    setLoading(false);
    setLevel(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">How hungry are you?</h2>

      <div className="flex gap-2">
        {levels.map((l) => (
          <button
            key={l.value}
            onClick={() => setLevel(l.value)}
            className={`px-4 py-2 rounded ${
              level === l.value ? "bg-green-600 text-white" : "bg-gray-200"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={loading || !level}
        className="px-4 py-2 bg-black text-white rounded"
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
