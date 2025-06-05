-- AlterTable
ALTER TABLE "User" ADD COLUMN     "availableTickets" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalTicketsEarned" INTEGER NOT NULL DEFAULT 0;
