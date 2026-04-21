/*
  Warnings:

  - Made the column `address` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `latitude` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `longitude` on table `Shop` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Shop" ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "latitude" SET NOT NULL,
ALTER COLUMN "latitude" SET DEFAULT 0.0,
ALTER COLUMN "longitude" SET NOT NULL,
ALTER COLUMN "longitude" SET DEFAULT 0.0;
