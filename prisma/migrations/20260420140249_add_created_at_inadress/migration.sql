-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('ORDER', 'CHAT', 'DELIVERY', 'SYSTEM');

-- AlterTable
ALTER TABLE "public"."Address" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
