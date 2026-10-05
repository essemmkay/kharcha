import { Loader2 } from "lucide-react";

// Shown while the local store's first liveQuery resolves on a read page.
export function PageLoading() {
  return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" />
    </div>
  );
}
