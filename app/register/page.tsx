import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthCard } from "../components/auth/AuthCard";
import { RegisterForm } from "../components/auth/RegsiterForm";

export default async function RegisterPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <AuthCard>
        <RegisterForm />
      </AuthCard>
    </main>
  );
}
