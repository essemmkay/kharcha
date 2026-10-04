"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import { deleteAccount, setAccountArchived } from "@/lib/actions/accounts";
import { AccountSheet } from "@/components/account-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { AccountFormValues } from "@/components/account-form";

export function AccountActions({
  account,
}: {
  account: AccountFormValues & { archived: boolean };
}) {
  const [pending, startTransition] = useTransition();

  function toggleArchive() {
    startTransition(async () => {
      const res = await setAccountArchived(account.id!, !account.archived);
      if (!res.ok) toast.error(res.error);
      else toast.success(account.archived ? "Unarchived" : "Archived");
    });
  }

  return (
    <div className="flex items-center">
      <AccountSheet
        account={account}
        trigger={
          <Button variant="ghost" size="icon" aria-label="Edit account">
            <Pencil className="size-4" />
          </Button>
        }
      />
      <Button
        variant="ghost"
        size="icon"
        aria-label={account.archived ? "Unarchive account" : "Archive account"}
        onClick={toggleArchive}
        disabled={pending}
      >
        {account.archived ? (
          <ArchiveRestore className="size-4" />
        ) : (
          <Archive className="size-4" />
        )}
      </Button>
      <ConfirmDialog
        title="Delete account?"
        description="This permanently deletes the account and all of its transactions. This cannot be undone."
        onConfirm={() => deleteAccount(account.id!)}
        trigger={
          <Button variant="ghost" size="icon" aria-label="Delete account">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        }
      />
    </div>
  );
}
