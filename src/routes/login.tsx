import { createFileRoute } from "@tanstack/react-router";
import { AuthForm, AuthShell } from "@/components/finora/auth-form";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — FINORA" },
      {
        name: "description",
        content: "Sign in to your FINORA account to manage your portfolio and wallet.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Sign in — FINORA" },
      { property: "og:description", content: "Access your FINORA portfolio and wallet." },
    ],
  }),
  component: () => (
    <AuthShell>
      <AuthForm mode="login" />
    </AuthShell>
  ),
});
