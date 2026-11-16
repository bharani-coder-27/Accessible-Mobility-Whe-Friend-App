-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'gpay');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('paid', 'unpaid');

-- AlterTable
ALTER TABLE "Bus" ADD COLUMN "fare" DOUBLE PRECISION NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "Notification"
  ADD COLUMN "from_lat" DOUBLE PRECISION,
  ADD COLUMN "from_lng" DOUBLE PRECISION,
  ADD COLUMN "dest_lat" DOUBLE PRECISION,
  ADD COLUMN "dest_lng" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Payment" (
  "id" SERIAL NOT NULL,
  "notification_id" INTEGER NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "method" "PaymentMethod" NOT NULL DEFAULT 'cash',
  "status" "PaymentStatus" NOT NULL DEFAULT 'paid',
  "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_notification_id_key" ON "Payment"("notification_id");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_notification_id_fkey"
  FOREIGN KEY ("notification_id") REFERENCES "Notification"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
