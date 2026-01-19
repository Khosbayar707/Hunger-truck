"use client";

import * as Dialog from "@radix-ui/react-dialog";
import HourPicker, { HungerLevel } from "./HourPicker";
import { Button } from "../ui/button";

type LogHungerDialogProps = {
  onSubmit?: (hour: number, level: HungerLevel) => void;
};

export function LogHungerDialog({ onSubmit }: LogHungerDialogProps) {
  function handleSelect(hour: number, level: HungerLevel) {
    onSubmit?.(hour, level);
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button>Log hunger</Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

        <Dialog.Content
          className="
            fixed left-1/2 top-1/2
            -translate-x-1/2 -translate-y-1/2
            w-[90vw] max-w-md
            rounded-xl border bg-background p-6 shadow-lg
            focus:outline-none
          "
        >
          <Dialog.Title className="text-lg font-semibold">
            Log hunger
          </Dialog.Title>

          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Select how hungry you feel right now.
          </Dialog.Description>

          <div className="mt-6">
            <HourPicker onSelect={handleSelect} />
          </div>

          <div className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <Button variant="outline">Close</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
