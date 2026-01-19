import { AuthCard } from "@/app/components/auth/AuthCard";
import { AuthRedirectListener } from "./AuthClient";
import { AuthForm } from "@/app/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <>
      <AuthRedirectListener />
      <div className="min-h-screen flex items-center justify-center">
        <AuthCard>
          <AuthForm />
        </AuthCard>
      </div>
    </>
  );
}
