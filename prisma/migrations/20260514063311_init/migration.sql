-- CreateTable
CREATE TABLE "Party" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "pan" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Declaration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Invoice" (
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
    CONSTRAINT "Invoice_billedToId_fkey" FOREIGN KEY ("billedToId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_shippedToId_fkey" FOREIGN KEY ("shippedToId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LineItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "hsn" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "rate" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "taxableValue" REAL NOT NULL,
    "cgstRate" REAL NOT NULL DEFAULT 0,
    "cgstAmount" REAL NOT NULL DEFAULT 0,
    "sgstRate" REAL NOT NULL DEFAULT 0,
    "sgstAmount" REAL NOT NULL DEFAULT 0,
    "igstRate" REAL NOT NULL DEFAULT 0,
    "igstAmount" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    CONSTRAINT "LineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Counter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "year" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo");
