-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hasWon" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastWinDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Winner" ADD COLUMN     "couponCode" TEXT;
