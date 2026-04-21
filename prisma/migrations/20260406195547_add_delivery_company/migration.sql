-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'DELIVERY_COMPANY';

-- AlterTable
ALTER TABLE "public"."DeliveryMan" ADD COLUMN     "companyId" TEXT;

-- CreateTable
CREATE TABLE "public"."DeliveryCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."ShopStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "DeliveryCompany_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryCompany_ownerId_key" ON "public"."DeliveryCompany"("ownerId");

-- AddForeignKey
ALTER TABLE "public"."DeliveryMan" ADD CONSTRAINT "DeliveryMan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."DeliveryCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryCompany" ADD CONSTRAINT "DeliveryCompany_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
