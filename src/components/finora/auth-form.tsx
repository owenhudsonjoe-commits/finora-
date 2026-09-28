import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ensureAccount } from "@/lib/finora.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FinoraLogo } from "./logo";

function passwordIssue(password: string) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
    return "Password must include both letters and numbers.";
  return null;
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    referral: "",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function afterSignIn() {
    try {
      await ensureAccount();
    } catch {
      /* profile creation is retried on the dashboard */
    }
    navigate({ to: "/dashboard" });
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (form.fullName.trim().length < 2) {
          toast.error("Enter your full name.");
          return;
        }
        if (form.phone.trim().length < 7) {
          toast.error("Enter a valid phone number.");
          return;
        }
        const issue = passwordIssue(form.password);
        if (issue) {
          toast.error(issue);
          return;
        }
        if (form.password !== form.confirm) {
          toast.error("Passwords do not match.");
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: form.fullName.trim(),
              phone: form.phone.trim(),
              referral_code: form.referral.trim().toUpperCase(),
            },
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (!data.session) {
          setSent(true);
          return;
        }
        await afterSignIn();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) {
          toast.error("Email or password is incorrect.");
          return;
        }
        await afterSignIn();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle(): Promise<void> {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in is unavailable right now.");
      return;
    }
    if (result.redirected) return;
    await afterSignIn();
  }

  if (sent) {
    return (
      <div className="surface-card p-8 text-center">
        <h1 className="text-xl font-semibold">Confirm your email</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          We sent a confirmation link to <span className="font-medium">{form.email}</span>. Open it
          to activate your FINORA account, then sign in.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link to="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="surface-card p-8">
      <div className="mb-7 text-center">
        <Link to="/" className="inline-block">
          <FinoraLogo />
        </Link>
        <h1 className="mt-5 text-xl font-semibold">
          {mode === "signup" ? "Create your FINORA account" : "Sign in to FINORA"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {mode === "signup"
            ? "A few details and your portfolio is ready."
            : "Access your portfolio and wallet."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" ? (
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={set("fullName")}
              autoComplete="name"
              required
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={set("email")}
            autoComplete="email"
            required
          />
        </div>

        {mode === "signup" ? (
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              autoComplete="tel"
              required
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={set("password")}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
          />
        </div>

        {mode === "signup" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                value={form.confirm}
                onChange={set("confirm")}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral">Referral code (optional)</Label>
              <Input
                id="referral"
                value={form.referral}
                onChange={set("referral")}
                placeholder="FINXXXXXX"
              />
            </div>
          </>
        ) : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </form>

      <div className="text-muted-foreground my-5 flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" />
        OR
        <span className="bg-border h-px flex-1" />
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
        Continue with Google
      </Button>

      <div className="text-muted-foreground mt-6 space-y-2 text-center text-sm">
        {mode === "login" ? (
          <>
            <p>
              <Link
                to="/forgot-password"
                className="hover:text-foreground underline underline-offset-4"
              >
                Forgot your password?
              </Link>
            </p>
            <p>
              New to FINORA?{" "}
              <Link
                to="/signup"
                className="text-foreground font-medium underline underline-offset-4"
              >
                Create an account
              </Link>
            </p>
          </>
        ) : (
          <p>
            Already registered?{" "}
            <Link to="/login" className="text-foreground font-medium underline underline-offset-4">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="gradient-hero flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
