-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "profession" TEXT,
ADD COLUMN     "profilePic" TEXT;
