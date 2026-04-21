/*
  Warnings:

  - A unique constraint covering the columns `[cartId,productId,variantKey]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."CartItem_cartId_productId_key";

-- AlterTable
ALTER TABLE "public"."CartItem" ADD COLUMN     "variantKey" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_variantKey_key" ON "public"."CartItem"("cartId", "productId", "variantKey");
