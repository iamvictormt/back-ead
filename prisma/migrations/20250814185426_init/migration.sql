/*
  Warnings:

  - Added the required column `category` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instructor` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Course" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "instructor" TEXT NOT NULL,
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "studentsCount" INTEGER NOT NULL DEFAULT 0;
