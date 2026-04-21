-- CreateEnum
CREATE TYPE "public"."Currency" AS ENUM ('USD', 'EUR', 'CDF', 'GBP');

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "currency" "public"."Currency" NOT NULL DEFAULT 'USD';
