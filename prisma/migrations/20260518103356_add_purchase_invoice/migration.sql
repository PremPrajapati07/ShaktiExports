-- CreateTable
CREATE TABLE "PurchaseSupplier" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "pan" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PurchaseBuyer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "pan" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PurchaseInvoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNo" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "diamondType" TEXT NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "sellerGstin" TEXT NOT NULL,
    "sellerPan" TEXT NOT NULL,
    "terms" TEXT,
    "bankerName" TEXT,
    "accountNo" TEXT,
    "ifsc" TEXT,
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
    CONSTRAINT "PurchaseInvoice_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "PurchaseBuyer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseLineItem" (
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
    CONSTRAINT "PurchaseLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "PurchaseInvoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseInvoice_invoiceNo_key" ON "PurchaseInvoice"("invoiceNo");
