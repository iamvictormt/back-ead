/*
  Warnings:

  - You are about to drop the `ProgressLesson` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ProgressLesson" DROP CONSTRAINT "ProgressLesson_progressId_fkey";

-- DropTable
DROP TABLE "public"."ProgressLesson";
