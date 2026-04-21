-- AlterTable
ALTER TABLE "public"."DeliveryCompany" ADD COLUMN     "address" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "phone" TEXT;
