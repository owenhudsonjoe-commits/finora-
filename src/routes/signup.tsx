import { createFileRoute } from "@tanstack/react-router";
import { AuthForm, AuthShell } from "@/components/finora/auth-form";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — FINORA" },
      {
        name: "description",
        content: "Open a FINORA account and start investing with transparent plan terms.",
      },
      { property: "og:title", content: "Create account — FINORA" },
      { property: "og:description", content: "Open a FINORA account in minutes." },
    ],
  }),
  component: () => (
    <AuthShell>
      <AuthForm mode="signup" />
    </AuthShell>
  ),
});
