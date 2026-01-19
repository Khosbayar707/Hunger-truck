import { AuthCard } from "./components/auth/AuthCard";
import { AuthForm } from "./components/auth/AuthForm";

export default function AuthPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background to-muted">
      <AuthCard>
        <AuthForm />
      </AuthCard>
    </main>
  );
}
