-- CreateEnum
CREATE TYPE "public"."DeliveryManStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."DeliveryMan" ADD COLUMN     "status" "public"."DeliveryManStatus" NOT NULL DEFAULT 'PENDING';
