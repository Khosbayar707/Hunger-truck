import { AuthCard } from "@/app/components/auth/AuthCard";
import { AuthRedirectListener } from "./AuthClient";
import { AuthForm } from "@/app/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <>
      <AuthRedirectListener />

      <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-emerald-50" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-32 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />

        <AuthCard>
          <AuthForm />
        </AuthCard>
      </div>
    </>
  );
}
