import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AdminShell } from "@/components/finora/admin-shell";
import { PageHeader, StatusBadge, LoadingRows, EmptyState } from "@/components/finora/primitives";
import { adminListUsers, adminSetUserStatus, adminAdjustBalance } from "@/lib/admin.functions";
import { money, dateOnly } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — FINORA admin" },
      { name: "description", content: "Review platform accounts, balances and account status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const list = useServerFn(adminListUsers);
  const setStatus = useServerFn(adminSetUserStatus);
  const adjust = useServerFn(adminAdjustBalance);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });

  const statusMutation = useMutation({
    mutationFn: (v: { id: string; status: "active" | "suspended" }) => setStatus({ data: v }),
    onSuccess: async () => {
      toast.success("Account status updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("The status could not be updated."),
  });

  const adjustMutation = useMutation({
    mutationFn: () =>
      adjust({ data: { userId: target!.id, amount: Number(amount), direction, reason } }),
    onSuccess: async (res) => {
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Balance adjusted and recorded in the ledger.");
      setTarget(null);
      setAmount("");
      setReason("");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("The adjustment could not be applied."),
  });

  const rows = (data ?? []).filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone ?? "").includes(q) ||
      u.referral_code.toLowerCase().includes(q)
    );
  });

  return (
    <AdminShell area="users">
      <PageHeader title="Users" description="Accounts, wallet balances and account standing." />

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, email, phone or referral code"
        className="mb-4 max-w-sm"
        aria-label="Search users"
      />

      {isLoading ? (
        <LoadingRows rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState title="No users found" description="Try a different search term." />
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Member</th>
                <th className="px-4 py-3 text-right font-medium">Available</th>
                <th className="px-4 py-3 text-right font-medium">Invested</th>
                <th className="px-4 py-3 text-center font-medium">Referrals</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-border/70 divide-y">
              {rows.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.full_name || "Unnamed"}</p>
                    <p className="text-muted-foreground text-xs">
                      {u.email} · joined {dateOnly(u.created_at)}
                    </p>
                  </td>
                  <td className="num px-4 py-3 text-right">{money(u.wallet?.available ?? 0)}</td>
                  <td className="num px-4 py-3 text-right">{money(u.invested)}</td>
                  <td className="px-4 py-3 text-center">{u.referralCount}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTarget({ id: u.id, name: u.full_name })}
                      >
                        Adjust
                      </Button>
                      <Button
                        size="sm"
                        variant={u.status === "active" ? "ghost" : "secondary"}
                        disabled={statusMutation.isPending}
                        onClick={() =>
                          statusMutation.mutate({
                            id: u.id,
                            status: u.status === "active" ? "suspended" : "active",
                          })
                        }
                      >
                        {u.status === "active" ? "Suspend" : "Activate"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust balance</DialogTitle>
            <DialogDescription>
              Manual adjustments are applied server-side, written to the ledger and recorded in the
              audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm font-medium">{target?.name}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={direction === "credit" ? "default" : "outline"}
                size="sm"
                onClick={() => setDirection("credit")}
              >
                Credit
              </Button>
              <Button
                type="button"
                variant={direction === "debit" ? "default" : "outline"}
                size="sm"
                onClick={() => setDirection("debit")}
              >
                Debit
              </Button>
            </div>
            <div>
              <Label htmlFor="adj-amount">Amount (PKR)</Label>
              <Input
                id="adj-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="adj-reason">Reason</Label>
              <Textarea
                id="adj-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={
                adjustMutation.isPending || !(Number(amount) > 0) || reason.trim().length < 3
              }
              onClick={() => adjustMutation.mutate()}
            >
              {adjustMutation.isPending ? "Applying…" : "Apply adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
