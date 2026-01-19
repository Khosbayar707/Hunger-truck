"use client";

import * as ToggleGroup from "@radix-ui/react-toggle-group";

export type HungerLevel = 2 | 4 | 6 | 8 | 10;

const levels: { v: HungerLevel; e: string }[] = [
  { v: 2, e: "😄" },
  { v: 4, e: "🙂" },
  { v: 6, e: "😐" },
  { v: 8, e: "😟" },
  { v: 10, e: "😫" },
];

type HourPickerProps = {
  value?: HungerLevel | null;
  onSelect: (hour: number, value: HungerLevel) => void;
  disabled?: boolean;
};

export default function HourPicker({
  value,
  onSelect,
  disabled,
}: HourPickerProps) {
  const hour = new Date().getHours();

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">
        How hungry are you at <span className="font-mono">{hour}:00</span>?
      </p>

      <ToggleGroup.Root
        type="single"
        value={value ? String(value) : undefined}
        disabled={disabled}
        onValueChange={(v) => {
          if (!v) return;
          onSelect(hour, Number(v) as HungerLevel);
        }}
        className="flex gap-2"
      >
        {levels.map((l) => (
          <ToggleGroup.Item
            key={l.v}
            value={String(l.v)}
            aria-label={`Hunger level ${l.v} out of 10`}
            className="
              h-12 w-12 rounded-lg text-2xl
              flex items-center justify-center
              border transition
              hover:bg-muted
              focus:outline-none focus:ring-2 focus:ring-ring
              active:scale-95
              data-[state=on]:bg-primary
              data-[state=on]:text-primary-foreground
              data-[state=on]:border-primary
              disabled:opacity-50
              disabled:pointer-events-none
            "
          >
            <span aria-hidden>{l.e}</span>
            <span className="sr-only">{l.v} out of 10</span>
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    </div>
  );
}
