import { AuthForm } from "@/components/auth-form";
import { Wallet } from "lucide-react";

export default function SignupPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Wallet className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Own your finance data. It is yours and stays yours.
          </p>
        </div>
        <AuthForm mode="signup" />
      </div>
    </main>
  );
}
