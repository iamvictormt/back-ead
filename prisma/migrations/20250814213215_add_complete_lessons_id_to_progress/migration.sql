/*
  Warnings:

  - You are about to drop the column `completedLessons` on the `Progress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Progress" DROP COLUMN "completedLessons",
ADD COLUMN     "completedLessonIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
