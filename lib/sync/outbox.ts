// Optimistic outbox for new transactions. Server stays the source of truth;
// this just lets a create show instantly and survive a flaky/absent connection.
// Pending creates live in localStorage and are replayed through the existing
// createTransaction server action. ponytail: creates only — edits/deletes go
// straight to the server (see transaction-form). Upgrade path: queue those too.
import { createTransaction } from "@/lib/actions/transactions";
import type { TxRow } from "@/lib/tx-row";

const KEY = "kharcha.outbox.v1";
const EMPTY: OutboxEntry[] = [];

export type OutboxEntry = {
  id: string; // temp id, also the optimistic row id
  input: unknown; // exact payload for createTransaction
  display: TxRow; // optimistic row rendered in lists
  error?: string; // last permanent rejection, if any
};

type Listener = () => void;

const listeners = new Set<Listener>();
let cache: OutboxEntry[] | null = null;
let syncing = false;

function read(): OutboxEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OutboxEntry[]) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function ensure(): OutboxEntry[] {
  if (cache === null) cache = read();
  return cache;
}

function set(entries: OutboxEntry[]) {
  cache = entries;
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // Storage full/blocked (private mode): keep the in-memory copy so the
    // current session still works; it just won't survive a reload.
  }
  emit();
}

function emit() {
  for (const l of listeners) l();
}

// --- store API (consumed via useSyncExternalStore) ---

export function getSnapshot(): OutboxEntry[] {
  return ensure();
}

export function getSyncing(): boolean {
  return syncing;
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = read(); // another tab changed it
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

// --- mutations ---

export function enqueue(input: unknown, display: TxRow) {
  set([...ensure(), { id: display.id, input, display }]);
  void flush();
}

export function discard(id: string) {
  set(ensure().filter((e) => e.id !== id));
}

export async function flush(): Promise<void> {
  if (syncing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  if (ensure().length === 0) return;

  syncing = true;
  emit();
  try {
    // Re-read each iteration so we never clobber entries added mid-flush.
    for (const entry of ensure()) {
      try {
        const res = await createTransaction(entry.input);
        if (res.ok) {
          set(ensure().filter((e) => e.id !== entry.id));
        } else {
          // Server rejected the data (e.g. account deleted). Retrying won't
          // help, so mark it and move on — the badge surfaces it for discard.
          set(ensure().map((e) => (e.id === entry.id ? { ...e, error: res.error } : e)));
        }
      } catch {
        // Network/DB error: stop and leave the rest queued for the next flush.
        break;
      }
    }
  } finally {
    syncing = false;
    emit();
  }
}
