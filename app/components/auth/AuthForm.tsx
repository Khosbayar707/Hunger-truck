"use client";

import * as Label from "@radix-ui/react-label";
import { Button, Text } from "@radix-ui/themes";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const isValid = email.includes("@");

  async function handleLogin() {
    setLoading(true);
    await supabase.auth.signInWithOtp({ email });
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-left">
        <Label.Root className="text-sm font-medium">Email address</Label.Root>

        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="
            w-full rounded-lg border border-input
            bg-background px-4 py-3 text-sm
            focus:outline-none focus:ring-2 focus:ring-ring
            transition
          "
        />
      </div>

      <div className="space-y-3">
        <Button
          size="3"
          variant="solid"
          color="violet"
          loading={loading}
          disabled={!isValid}
          onClick={handleLogin}
          className="w-full"
        >
          Send magic link
        </Button>

        <Text size="1" color="gray" align="center">
          We’ll email you a secure sign-in link.
        </Text>
      </div>

      <Text size="1" color="gray" align="center">
        No passwords. No spam.
      </Text>
    </div>
  );
}
