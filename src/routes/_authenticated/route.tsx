import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Admin routes (/admin, /admin/*) have their own dedicated AdminSecurityGate
    // with in-place authentication, verification, and platform setup.
    // Do not bounce administrators to the customer login screen.
    if (location.pathname === "/admin" || location.pathname.startsWith("/admin/")) {
      return { user: null };
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
