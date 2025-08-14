-- CreateTable
CREATE TABLE "public"."ProgressLesson" (
    "id" SERIAL NOT NULL,
    "progressId" INTEGER NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressLesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgressLesson_progressId_lessonId_key" ON "public"."ProgressLesson"("progressId", "lessonId");

-- AddForeignKey
ALTER TABLE "public"."ProgressLesson" ADD CONSTRAINT "ProgressLesson_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "public"."Progress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
