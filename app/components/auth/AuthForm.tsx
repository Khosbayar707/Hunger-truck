"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { MailIcon, AlertCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const isValid = email.includes("@");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);
    setError("");

    const redirectTo = process.env.NEXT_PUBLIC_SITE_URL + "/auth/callback";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSubmitted(true);
    }

    setLoading(false);
  }

  /* ───────────── Success ───────────── */
  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          We sent a sign-in link to
        </p>

        <p className="text-sm font-medium break-all">{email}</p>

        <p className="text-xs text-muted-foreground">
          Check your inbox (and spam folder).
        </p>

        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            setSubmitted(false);
            setEmail("");
          }}
        >
          Use a different email
        </Button>
      </div>
    );
  }

  /* ───────────── Form ───────────── */
  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>

        <div className="relative">
          <Input
            id="email"
            type="email"
            placeholder="  you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            disabled={loading}
            className={`pl-10 ${
              error ? "border-red-500 focus-visible:ring-red-500" : ""
            }`}
          />
        </div>

        {!error && (
          <p className="text-xs text-muted-foreground">
            We’ll email you a magic sign-in link.
          </p>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <Button type="submit" disabled={!isValid || loading} className="w-full">
        {loading ? "Sending…" : "Send magic link"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        No passwords. No tracking.
      </p>
    </form>
  );
}
