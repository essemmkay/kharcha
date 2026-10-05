"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions/settings";
import { setMeta } from "@/lib/db/local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  name,
  baseCurrency,
}: {
  name: string;
  baseCurrency: string;
}) {
  const [pending, startTransition] = useTransition();
  const [n, setN] = useState(name);
  const [cur, setCur] = useState(baseCurrency);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      // Profile isn't part of the offline sync queue; this edit needs a
      // connection. On success, mirror it into local meta so the UI (currency,
      // name) updates immediately. ponytail: online-only; queue it if needed.
      const res = await updateProfile({ name: n, baseCurrency: cur });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      await setMeta({ name: n || null, baseCurrency: cur });
      toast.success("Profile saved");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="p-name">Name</Label>
        <Input id="p-name" value={n} onChange={(e) => setN(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="p-cur">Base currency</Label>
        <Input
          id="p-cur"
          value={cur}
          maxLength={3}
          onChange={(e) => setCur(e.target.value.toUpperCase())}
        />
        <p className="text-xs text-muted-foreground">
          Used for net worth and report totals. Each account can still have its own currency.
        </p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
