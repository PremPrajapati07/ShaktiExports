-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Invoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNo" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "diamondType" TEXT NOT NULL,
    "billedToId" INTEGER NOT NULL,
    "shippedToId" INTEGER NOT NULL,
    "gstin" TEXT NOT NULL,
    "pan" TEXT NOT NULL,
    "terms" TEXT,
    "banker" TEXT,
    "accountNo" TEXT,
    "ifsc" TEXT,
    "districtOriginCode" TEXT,
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
    CONSTRAINT "Invoice_billedToId_fkey" FOREIGN KEY ("billedToId") REFERENCES "Party" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invoice_shippedToId_fkey" FOREIGN KEY ("shippedToId") REFERENCES "Party" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("accountNo", "amountAfterTax", "banker", "billedToId", "cgstTotal", "createdAt", "date", "declarationText", "diamondType", "districtOriginCode", "gstin", "id", "ifsc", "igstTotal", "invoiceNo", "pan", "roundOff", "sgstTotal", "shippedToId", "taxableAmount", "terms", "totalTax", "totalValue", "totalWords", "type") SELECT "accountNo", "amountAfterTax", "banker", "billedToId", "cgstTotal", "createdAt", "date", "declarationText", "diamondType", "districtOriginCode", "gstin", "id", "ifsc", "igstTotal", "invoiceNo", "pan", "roundOff", "sgstTotal", "shippedToId", "taxableAmount", "terms", "totalTax", "totalValue", "totalWords", "type" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
