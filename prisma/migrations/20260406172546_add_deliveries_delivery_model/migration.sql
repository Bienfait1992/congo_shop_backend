-- CreateEnum
CREATE TYPE "public"."DeliveryStatus" AS ENUM ('PENDING', 'PICKED_UP', 'DELIVERING', 'DELIVERED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."Delivery" ADD COLUMN     "deliveryManId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Delivery" ADD CONSTRAINT "Delivery_deliveryManId_fkey" FOREIGN KEY ("deliveryManId") REFERENCES "public"."DeliveryMan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
