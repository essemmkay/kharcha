// Wire + local-store shapes for offline-first sync. Money is carried as a
// number and dates as ISO strings so the payload serializes cleanly across the
// server-action boundary and into IndexedDB. These mirror the Prisma models
// minus relations (transactions carry tag ids for the local join table).

import type {
  AccountType,
  CategoryKind,
  TransactionType,
} from "@/lib/generated/prisma";

export type SyncAccount = {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  openingBalance: number;
  note: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type SyncCategory = {
  id: string;
  name: string;
  kind: CategoryKind;
  icon: string | null;
  color: string | null;
  parentId: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type SyncTag = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type SyncTransaction = {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // Tag names, not ids: there is no tag-management UI, so the client never needs
  // the server's Tag rows. The server still owns Tag records (connectOrCreate).
  tags: string[];
};

export type SyncSnapshot = {
  user: { email: string; name: string | null; baseCurrency: string };
  accounts: SyncAccount[];
  categories: SyncCategory[];
  transactions: SyncTransaction[];
  serverTime: string;
};

// A queued local mutation, replayed to the server in order on push.
export type Entity = "account" | "category" | "transaction";
export type Op = "create" | "update" | "delete";

export type Mutation = {
  id: string; // queue entry id (uuid)
  entity: Entity;
  op: Op;
  recordId: string; // client-authoritative id of the affected record
  payload: unknown; // input for the server action (create/update); {} for delete
  error?: string; // last permanent rejection, if any
};
