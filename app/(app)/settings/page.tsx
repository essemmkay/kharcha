"use client";

import Link from "next/link";
import { ChevronRight, Tag, Wallet } from "lucide-react";
import { useLocalData } from "@/lib/db/use-local-data";
import { ProfileForm } from "@/components/profile-form";
import { ExportDataButton, LogoutButton } from "@/components/settings-actions";
import { PageLoading } from "@/components/page-loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const { ready, name, baseCurrency, email } = useLocalData();

  if (!ready) return <PageLoading />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm name={name ?? ""} baseCurrency={baseCurrency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manage</CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0">
          <NavRow href="/accounts" icon={Wallet} label="Accounts" />
          <NavRow href="/categories" icon={Tag} label="Categories" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Your data lives in your own database. Export a full copy any time.
          </p>
          <ExportDataButton />
          <LogoutButton />
        </CardContent>
      </Card>

      <p className="pb-2 text-center text-xs text-muted-foreground">
        Signed in as {email}
      </p>
    </div>
  );
}

function NavRow({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3">
      <Icon className="size-5 text-muted-foreground" />
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
