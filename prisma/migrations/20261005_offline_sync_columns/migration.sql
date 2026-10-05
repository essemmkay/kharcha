-- Offline-first incremental delta sync: add updatedAt/deletedAt tombstone
-- columns and delta-pull indexes to every synced model. Existing rows are
-- backfilled by the CURRENT_TIMESTAMP default (matches @default(now())).

-- Account
ALTER TABLE "Account" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Account" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "Account_userId_updatedAt_idx" ON "Account"("userId", "updatedAt");

-- Category (also gains createdAt, which it lacked)
ALTER TABLE "Category" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Category" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Category" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "Category_userId_updatedAt_idx" ON "Category"("userId", "updatedAt");

-- Transaction
ALTER TABLE "Transaction" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Transaction" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "Transaction_userId_updatedAt_idx" ON "Transaction"("userId", "updatedAt");

-- Tag (also gains createdAt, which it lacked)
ALTER TABLE "Tag" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Tag" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Tag" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "Tag_userId_updatedAt_idx" ON "Tag"("userId", "updatedAt");
