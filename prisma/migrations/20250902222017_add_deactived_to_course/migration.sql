/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `Course` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Course" DROP COLUMN "deletedAt",
ADD COLUMN     "deactivatedIn" TIMESTAMP(3);
