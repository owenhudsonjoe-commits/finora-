import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminSecurityGate } from "@/components/finora/admin-security-gate";

export const Route = createFileRoute("/_authenticated/admin")({
  component: () => (
    <AdminSecurityGate>
      <Outlet />
    </AdminSecurityGate>
  ),
});
