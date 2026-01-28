"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      setError(error?.message ?? "Login failed");
      setLoading(false);
      return;
    }

    setSuccess(true);

    // ✅ wait for session to be readable
    await supabase.auth.getSession();

    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 800);
  }

  /* ───────── Success state ───────── */
  if (success) {
    return (
      <div className="space-y-3 text-center">
        <h2 className="text-lg font-semibold">Welcome back 👋</h2>
        <p className="text-sm text-muted-foreground">
          You’re logged in successfully.
        </p>
        <p className="text-xs text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  /* ───────── Form ───────── */
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label>Password</Label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
