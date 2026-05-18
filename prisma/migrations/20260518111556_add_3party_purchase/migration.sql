/*
  Warnings:

  - You are about to drop the column `buyerId` on the `PurchaseInvoice` table. All the data in the column will be lost.
  - Added the required column `billToId` to the `PurchaseInvoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shipToId` to the `PurchaseInvoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PurchaseSupplier" ADD COLUMN "accountNo" TEXT;
ALTER TABLE "PurchaseSupplier" ADD COLUMN "bankerName" TEXT;
ALTER TABLE "PurchaseSupplier" ADD COLUMN "ifsc" TEXT;
ALTER TABLE "PurchaseSupplier" ADD COLUMN "swiftCode" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PurchaseBuyer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "pan" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Both',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PurchaseBuyer" ("address", "city", "createdAt", "gstin", "id", "name", "pan", "state", "stateCode", "updatedAt") SELECT "address", "city", "createdAt", "gstin", "id", "name", "pan", "state", "stateCode", "updatedAt" FROM "PurchaseBuyer";
DROP TABLE "PurchaseBuyer";
ALTER TABLE "new_PurchaseBuyer" RENAME TO "PurchaseBuyer";
CREATE TABLE "new_PurchaseInvoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNo" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "diamondType" TEXT NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "shipToId" INTEGER NOT NULL,
    "billToId" INTEGER NOT NULL,
    "sellerGstin" TEXT NOT NULL,
    "sellerPan" TEXT NOT NULL,
    "terms" TEXT,
    "bankerName" TEXT,
    "accountNo" TEXT,
    "ifsc" TEXT,
    "swiftCode" TEXT,
    "taxableAmount" REAL NOT NULL,
    "cgstTotal" REAL NOT NULL DEFAULT 0,
    "sgstTotal" REAL NOT NULL DEFAULT 0,
    "igstTotal" REAL NOT NULL DEFAULT 0,
    "totalTax" REAL NOT NULL,
    "amountAfterTax" REAL NOT NULL,
    "roundOff" REAL NOT NULL,
    "totalValue" REAL NOT NULL,
    "totalWords" TEXT NOT NULL,
    "declarationText" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseInvoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "PurchaseSupplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseInvoice_shipToId_fkey" FOREIGN KEY ("shipToId") REFERENCES "PurchaseBuyer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseInvoice_billToId_fkey" FOREIGN KEY ("billToId") REFERENCES "PurchaseBuyer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseInvoice" ("accountNo", "amountAfterTax", "bankerName", "cgstTotal", "createdAt", "date", "declarationText", "diamondType", "id", "ifsc", "igstTotal", "invoiceNo", "roundOff", "sellerGstin", "sellerPan", "sgstTotal", "supplierId", "taxableAmount", "terms", "totalTax", "totalValue", "totalWords", "type") SELECT "accountNo", "amountAfterTax", "bankerName", "cgstTotal", "createdAt", "date", "declarationText", "diamondType", "id", "ifsc", "igstTotal", "invoiceNo", "roundOff", "sellerGstin", "sellerPan", "sgstTotal", "supplierId", "taxableAmount", "terms", "totalTax", "totalValue", "totalWords", "type" FROM "PurchaseInvoice";
DROP TABLE "PurchaseInvoice";
ALTER TABLE "new_PurchaseInvoice" RENAME TO "PurchaseInvoice";
CREATE UNIQUE INDEX "PurchaseInvoice_invoiceNo_key" ON "PurchaseInvoice"("invoiceNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
