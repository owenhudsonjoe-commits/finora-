import { useState, useEffect, type ReactNode, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Lock, AlertCircle, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FinoraLogo } from "@/components/finora/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyAdminUsername } from "@/lib/admin.functions";

const ADMIN_STORAGE_KEY = "finora_admin_gate_unlocked";

export function AdminSecurityGate({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState<boolean>(false);

  const verifyFn = useServerFn(verifyAdminUsername);
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(ADMIN_STORAGE_KEY);
      if (stored && stored.toLowerCase() === "umairi455") {
        setIsUnlocked(true);
      }
    } catch {
      // Ignore sessionStorage errors
    } finally {
      setIsCheckingSession(false);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmed = usernameInput.trim();

    if (!trimmed) {
      setErrorMsg("Please enter the administrator username.");
      return;
    }

    setIsPending(true);
    try {
      const res = await verifyFn({ data: { username: trimmed } });
      if (!res.ok) {
        setErrorMsg(res.message || "Invalid administrator username. Access denied.");
        toast.error("Access denied: Invalid administrator username.");
        return;
      }

      sessionStorage.setItem(ADMIN_STORAGE_KEY, "umairi455");
      await queryClient.invalidateQueries({ queryKey: ["admin-session"] });
      setIsUnlocked(true);
      toast.success("Administrator verified. Access granted.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to verify administrator credentials.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsPending(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-slate-100">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(16,185,129,0.12),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:3rem_3rem]" />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex justify-center">
            <FinoraLogo />
          </div>

          <div className="mt-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-inner">
              <Lock className="h-6 w-6" />
            </div>

            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-[0.7rem] font-medium text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>SECURITY CHECKPOINT</span>
            </div>

            <h1 className="mt-3 text-xl font-semibold tracking-tight text-white">
              Administrator Verification
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Access to <span className="font-mono text-emerald-400">/admin</span> is restricted.
              Enter your designated administrator username to unlock the control centre.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-username" className="text-xs font-medium text-slate-300">
                Administrator Username
              </Label>
              <Input
                id="admin-username"
                type="text"
                autoComplete="off"
                autoFocus
                placeholder="Enter username"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                disabled={isPending}
                className="border-slate-700 bg-slate-950/80 text-white placeholder:text-slate-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-emerald-500 font-semibold text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying credentials…
                </>
              ) : (
                <>
                  Verify & Access Admin <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center text-xs text-slate-400 transition-colors hover:text-slate-200"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Return to user dashboard
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center font-mono text-[0.7rem] text-slate-500">
          AUDIT ID: FIN-SEC-GATE · ATOMIC ROLE ENFORCEMENT
        </p>
      </div>
    </div>
  );
}
