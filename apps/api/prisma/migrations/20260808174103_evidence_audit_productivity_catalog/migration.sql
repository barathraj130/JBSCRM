-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('LEAD_IMPORTED', 'LEAD_ASSIGNED', 'LEAD_REASSIGNED', 'LEAD_STATUS_CHANGED', 'WHATSAPP_MESSAGE_SENT', 'WHATSAPP_MESSAGE_RECEIVED', 'CATALOG_SENT', 'CALL_LOGGED', 'QUOTATION_CREATED', 'QUOTATION_SENT', 'FOLLOW_UP_SCHEDULED', 'FOLLOW_UP_COMPLETED', 'NOTE_ADDED', 'CUSTOMER_CREATED', 'DEAL_WON');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('VERIFIED', 'SELF_REPORTED');

-- CreateEnum
CREATE TYPE "CallDirection" AS ENUM ('INCOMING', 'OUTGOING');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'UNCONTACTED_LEAD_ALERT';

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "externalLeadId" TEXT,
ADD COLUMN     "rawSourcePayload" JSONB;

-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "previousVersionId" TEXT;

-- AlterTable
ALTER TABLE "whatsapp_messages" ADD COLUMN     "catalogId" TEXT;

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_products" (
    "id" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "catalog_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "actorName" TEXT NOT NULL,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "source" TEXT NOT NULL DEFAULT 'web',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "leadId" TEXT,
    "employeeId" TEXT,
    "type" "EvidenceType" NOT NULL,
    "status" "EvidenceStatus" NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calls" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "employeeId" TEXT,
    "direction" "CallDirection" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "status" TEXT NOT NULL,
    "outcome" TEXT,
    "recordingRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_assignment_history" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    "changedById" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_assignment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_duplicate_attempts" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "attemptedById" TEXT,
    "existingCustomerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_duplicate_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productivity_score_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productivity_score_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- CreateIndex
CREATE INDEX "catalogs_categoryId_idx" ON "catalogs"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_products_catalogId_productId_key" ON "catalog_products"("catalogId", "productId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_objectType_objectId_idx" ON "audit_logs"("objectType", "objectId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "evidence_employeeId_occurredAt_idx" ON "evidence"("employeeId", "occurredAt");

-- CreateIndex
CREATE INDEX "evidence_customerId_idx" ON "evidence"("customerId");

-- CreateIndex
CREATE INDEX "evidence_type_status_idx" ON "evidence"("type", "status");

-- CreateIndex
CREATE INDEX "calls_customerId_idx" ON "calls"("customerId");

-- CreateIndex
CREATE INDEX "calls_employeeId_idx" ON "calls"("employeeId");

-- CreateIndex
CREATE INDEX "lead_assignment_history_leadId_idx" ON "lead_assignment_history"("leadId");

-- CreateIndex
CREATE INDEX "customer_duplicate_attempts_existingCustomerId_idx" ON "customer_duplicate_attempts"("existingCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "productivity_score_config_key_key" ON "productivity_score_config"("key");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_key_key" ON "user_permissions"("userId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "leads_externalLeadId_key" ON "leads"("externalLeadId");

-- CreateIndex
CREATE UNIQUE INDEX "notes_previousVersionId_key" ON "notes"("previousVersionId");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogs" ADD CONSTRAINT "catalogs_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignment_history" ADD CONSTRAINT "lead_assignment_history_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignment_history" ADD CONSTRAINT "lead_assignment_history_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignment_history" ADD CONSTRAINT "lead_assignment_history_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_assignment_history" ADD CONSTRAINT "lead_assignment_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_duplicate_attempts" ADD CONSTRAINT "customer_duplicate_attempts_attemptedById_fkey" FOREIGN KEY ("attemptedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_duplicate_attempts" ADD CONSTRAINT "customer_duplicate_attempts_existingCustomerId_fkey" FOREIGN KEY ("existingCustomerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productivity_score_config" ADD CONSTRAINT "productivity_score_config_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- Data migration: Product.category/subcategory (free text) -> Category tree + Product.categoryId
-- ============================================================

-- AlterTable: add categoryId as nullable first so existing rows can be backfilled
ALTER TABLE "products" ADD COLUMN "categoryId" TEXT;

DO $$
DECLARE
  rec RECORD;
  parent_id TEXT;
  child_id TEXT;
BEGIN
  FOR rec IN SELECT DISTINCT category, subcategory FROM products LOOP
    SELECT id INTO parent_id FROM categories WHERE name = rec.category AND "parentId" IS NULL LIMIT 1;
    IF parent_id IS NULL THEN
      parent_id := 'cat_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20);
      INSERT INTO categories (id, name, "parentId", "createdAt") VALUES (parent_id, rec.category, NULL, NOW());
    END IF;

    IF rec.subcategory IS NOT NULL AND rec.subcategory <> '' THEN
      SELECT id INTO child_id FROM categories WHERE name = rec.subcategory AND "parentId" = parent_id LIMIT 1;
      IF child_id IS NULL THEN
        child_id := 'cat_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20);
        INSERT INTO categories (id, name, "parentId", "createdAt") VALUES (child_id, rec.subcategory, parent_id, NOW());
      END IF;
      UPDATE products SET "categoryId" = child_id WHERE category = rec.category AND subcategory IS NOT DISTINCT FROM rec.subcategory;
    ELSE
      UPDATE products SET "categoryId" = parent_id WHERE category = rec.category AND subcategory IS NOT DISTINCT FROM rec.subcategory;
    END IF;
  END LOOP;
END $$;

-- DropIndex
DROP INDEX "products_category_idx";

-- AlterTable: finalize categoryId as required, drop legacy string columns
ALTER TABLE "products" ALTER COLUMN "categoryId" SET NOT NULL;
ALTER TABLE "products" DROP COLUMN "category";
ALTER TABLE "products" DROP COLUMN "subcategory";

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
