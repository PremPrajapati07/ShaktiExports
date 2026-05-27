/**
 * Demo Data Seed Script
 * Adds comprehensive sample data WITHOUT wiping existing users/profile.
 * Run: npx ts-node prisma/seed-demo.ts
 */

import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  const data = new TextEncoder().encode(password + 'shakti_salt_99')
  return crypto.createHash('sha256').update(data).digest('hex')
}

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  
  if (num === 0) return 'Zero'
  
  const convert = (n: number): string => {
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '')
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '')
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '')
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '')
  }
  
  const rounded = Math.round(num)
  return 'INR ' + convert(rounded) + ' Only'
}

async function main() {
  console.log('🌱 Starting demo data seed...\n')

  // ── 0. Clear demo tables (leave users intact) ──────────────────────────────
  console.log('Clearing existing demo data...')
  await prisma.auditLog.deleteMany({})
  await prisma.paymentAllocation.deleteMany({})
  await prisma.paymentTransaction.deleteMany({})
  await prisma.lineItem.deleteMany({})
  await prisma.invoice.deleteMany({})
  await prisma.purchaseLineItem.deleteMany({})
  await prisma.purchaseInvoice.deleteMany({})
  await prisma.party.deleteMany({})
  await prisma.purchaseSupplier.deleteMany({})
  await prisma.purchaseBuyer.deleteMany({})
  await prisma.declaration.deleteMany({})
  await prisma.counter.deleteMany({})
  await prisma.stockLedger.deleteMany({})
  await prisma.stock.deleteMany({})

  // Ensure users exist
  const existingAdmin = await prisma.user.findUnique({ where: { username: 'admin' } })
  if (!existingAdmin) {
    await prisma.user.createMany({
      data: [
        { username: 'admin', password: hashPassword('admin123'), role: 'ADMIN' },
        { username: 'accountant', password: hashPassword('accountant123'), role: 'ACCOUNTANT' },
        { username: 'operator', password: hashPassword('operator123'), role: 'OPERATOR' },
      ]
    })
    console.log('✅ Created default users')
  } else {
    console.log('✅ Users already exist')
  }

  // ── 1. DECLARATIONS ────────────────────────────────────────────────────────
  console.log('\n📜 Creating Declarations...')
  const decl1 = await prisma.declaration.create({
    data: {
      title: 'Standard Conflict-Free Declaration',
      body: `The Diamonds herein invoiced have been purchased from Legitimate sources not involved in funding conflict & in Compliances with United Nations resolutions. The seller hereby guarantees that these diamonds are conflict free, based on personal knowledge, and/or written guarantees provided by the supplier of these diamonds.

The diamonds are Natural and Untreated unless specified otherwise. The acceptance of goods herein invoiced will be as per the WFDB guidelines.

The diamonds have been purchased from legitimate sources and not involved in funding conflict and are in compliance with the UN resolution.

Any dispute arising out of this invoice shall be subject to exclusive jurisdiction of Surat Courts only.`
    }
  })

  const decl2 = await prisma.declaration.create({
    data: {
      title: 'Lab Grown Diamond Declaration',
      body: `The diamonds herein invoiced are Laboratory Grown Diamonds (LGD) created by advanced technological processes. These are not mined diamonds.

The Lab Grown Diamonds herein invoiced are certified and graded as per industry standards. The seller guarantees the authenticity of all certifications provided.

These Lab Grown Diamonds comply with all applicable regulations and disclosure requirements of the FTC (Federal Trade Commission) and BIS (Bureau of Indian Standards).

Any dispute arising out of this invoice shall be subject to exclusive jurisdiction of Surat Courts only.`
    }
  })
  console.log(`  ✅ Created ${2} declarations`)

  // ── 2. SELL PARTIES ────────────────────────────────────────────────────────
  console.log('\n👥 Creating Sell Parties (Buyers & Consignees)...')

  const party1 = await prisma.party.create({
    data: {
      name: 'Mehzab Jewellery Pvt Ltd',
      address: '192-L Model Town, Jalandhar, Punjab',
      city: 'Jalandhar',
      state: 'Punjab',
      stateCode: '03',
      gstin: '03ADKPN6562B2ZQ',
      pan: 'ADKPN6562B',
      type: 'Both'
    }
  })

  const party2 = await prisma.party.create({
    data: {
      name: 'Hira Diamond Company',
      address: '12, Sagrampura, Ring Road, Surat',
      city: 'Surat',
      state: 'Gujarat',
      stateCode: '24',
      gstin: '24AAAAA1234A1Z5',
      pan: 'AAAAA1234A',
      type: 'Both'
    }
  })

  const party3 = await prisma.party.create({
    data: {
      name: 'Lalwani Gems & Jewels',
      address: '45, Karol Bagh Market, New Delhi',
      city: 'New Delhi',
      state: 'Delhi',
      stateCode: '07',
      gstin: '07BBBBB5678B1Z3',
      pan: 'BBBBB5678B',
      type: 'Both'
    }
  })

  const party4 = await prisma.party.create({
    data: {
      name: 'Sterling Diamond Exports',
      address: 'Plot 7, SEEPZ, Andheri East, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      gstin: '27CCCCC9012C1Z1',
      pan: 'CCCCC9012C',
      type: 'Both'
    }
  })
  console.log(`  ✅ Created 4 sell parties`)

  // ── 3. PURCHASE SUPPLIERS ──────────────────────────────────────────────────
  console.log('\n🏭 Creating Purchase Suppliers...')

  const sup1 = await prisma.purchaseSupplier.create({
    data: {
      name: 'Prism Diamond LLP',
      address: 'B-203, Diamond Bourse, Bandra-Kurla Complex, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      gstin: '27DDDDD3456D1Z9',
      pan: 'DDDDD3456D',
      bankerName: 'HDFC Bank Ltd',
      accountNo: '50200012345678',
      ifsc: 'HDFC0001234',
      swiftCode: 'HDFCINBB'
    }
  })

  const sup2 = await prisma.purchaseSupplier.create({
    data: {
      name: 'Kiran Gems Pvt Ltd',
      address: '35, Katargam Diamond Market, Surat',
      city: 'Surat',
      state: 'Gujarat',
      stateCode: '24',
      gstin: '24EEEEE7890E1Z7',
      pan: 'EEEEE7890E',
      bankerName: 'State Bank of India',
      accountNo: '32145678901234',
      ifsc: 'SBIN0007890',
      swiftCode: ''
    }
  })

  const sup3 = await prisma.purchaseSupplier.create({
    data: {
      name: 'Global Diamond Corporation',
      address: '201, Iscon Ambli Road, Ahmedabad',
      city: 'Ahmedabad',
      state: 'Gujarat',
      stateCode: '24',
      gstin: '24FFFFF1234F1Z5',
      pan: 'FFFFF1234F',
      bankerName: 'Axis Bank Ltd',
      accountNo: '912020012345678',
      ifsc: 'UTIB0001234',
      swiftCode: 'AXISINBB'
    }
  })
  console.log(`  ✅ Created 3 suppliers`)

  // ── 4. PURCHASE BUYERS ─────────────────────────────────────────────────────
  console.log('\n🏢 Creating Purchase Buyers...')

  // Company profile buyer (self - isCompany = true)
  const companyBuyer = await prisma.purchaseBuyer.create({
    data: {
      name: 'SHAKTI EXPORTS',
      address: 'B/503, Rajratna Enclave, B/h. Sanskruti Township, Pal, Surat',
      city: 'Surat',
      state: 'Gujarat',
      stateCode: '24',
      gstin: '24AAAAA0000A1Z5',
      pan: 'ABCDE1234F',
      type: 'Both',
      isCompany: true
    }
  })

  const buyer2 = await prisma.purchaseBuyer.create({
    data: {
      name: 'Rajkot Diamond Traders',
      address: '56, Jewellery Market, Rajkot',
      city: 'Rajkot',
      state: 'Gujarat',
      stateCode: '24',
      gstin: '24GGGGG5678G1Z3',
      pan: 'GGGGG5678G',
      type: 'Both',
      isCompany: false
    }
  })

  const buyer3 = await prisma.purchaseBuyer.create({
    data: {
      name: 'Pune Diamond Hub',
      address: '78, Shivajinagar, Pune',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      gstin: '27HHHHH9012H1Z1',
      pan: 'HHHHH9012H',
      type: 'ShipTo',
      isCompany: false
    }
  })
  console.log(`  ✅ Created 3 purchase buyers (including company profile)`)

  // ── 5. STOCK INITIALIZATION ─────────────────────────────────────────────────
  console.log('\n📦 Initializing Stock...')
  await prisma.stock.createMany({
    data: [
      { id: 'LabGrown', diamondType: 'LabGrown', totalCarats: 0 },
      { id: 'Natural', diamondType: 'Natural', totalCarats: 0 },
    ]
  })

  // ── 6. PURCHASE INVOICES ───────────────────────────────────────────────────
  console.log('\n📥 Creating Purchase Invoices...')
  const profileData = {
    gstin: '24AAAAA0000A1Z5',
    pan: 'ABCDE1234F',
    banker: 'STATE BANK OF INDIA',
    accountNo: '12345678901',
    ifsc: 'SBIN0000001',
    swiftCode: ''
  }

  // PI 1: Inter-state, LGD from Prism Diamond (50 ct)
  const pi1Date = new Date('2025-04-10')
  const pi1Taxable = 300000 // 50 ct × ₹6,000/ct
  const pi1Igst = Math.round(pi1Taxable * 0.015 * 100) / 100
  const pi1Total = Math.round((pi1Taxable + pi1Igst) * 100) / 100

  await prisma.counter.upsert({
    where: { id: 'Buy-Inter-LGD' },
    update: { lastNumber: 1, year: '25-26' },
    create: { id: 'Buy-Inter-LGD', lastNumber: 1, year: '25-26' }
  })

  const purchaseInv1 = await prisma.purchaseInvoice.create({
    data: {
      invoiceNo: 'P-LGD/001/25-26',
      date: pi1Date,
      type: 'Inter',
      diamondType: 'LabGrown',
      supplierId: sup1.id,
      shipToId: companyBuyer.id,
      billToId: companyBuyer.id,
      sellerGstin: sup1.gstin,
      sellerPan: sup1.pan,
      terms: 'CREDIT',
      bankerName: sup1.bankerName,
      accountNo: sup1.accountNo,
      ifsc: sup1.ifsc,
      swiftCode: sup1.swiftCode,
      taxableAmount: pi1Taxable,
      igstTotal: pi1Igst,
      cgstTotal: 0,
      sgstTotal: 0,
      totalTax: pi1Igst,
      amountAfterTax: pi1Taxable + pi1Igst,
      roundOff: 0,
      totalValue: pi1Total,
      totalWords: numberToWords(pi1Total),
      declarationText: decl2.body,
      templateType: 'Standard',
      isDigitallySigned: false,
      lineItems: {
        create: [
          {
            description: 'Round Brilliant Cut Lab Grown Diamond (CVD), Certified, SI1-VS2, E-F-G',
            hsn: '71049100',
            quantity: 30,
            rate: 6000,
            discount: 0,
            taxableValue: 180000,
            igstRate: 1.5,
            igstAmount: 2700,
            cgstRate: 0, cgstAmount: 0,
            sgstRate: 0, sgstAmount: 0,
            total: 182700
          },
          {
            description: 'Fancy Cut Lab Grown Diamond (CVD), Certified, VS1-VVS2, D-E-F',
            hsn: '71049100',
            quantity: 20,
            rate: 6000,
            discount: 0,
            taxableValue: 120000,
            igstRate: 1.5,
            igstAmount: 1800,
            cgstRate: 0, cgstAmount: 0,
            sgstRate: 0, sgstAmount: 0,
            total: 121800
          }
        ]
      }
    }
  })

  // Stock ledger for PI1
  await prisma.stockLedger.create({
    data: {
      diamondType: 'LabGrown',
      date: pi1Date,
      transactionType: 'PURCHASE',
      carats: 50,
      referenceId: purchaseInv1.id,
      referenceNo: 'P-LGD/001/25-26',
      partyId: sup1.id,
      partyName: sup1.name,
      partyType: 'SUPPLIER'
    }
  })
  await prisma.stock.update({
    where: { diamondType: 'LabGrown' },
    data: { totalCarats: { increment: 50 } }
  })

  // PI 2: Intra-state, Natural from Kiran Gems (15 ct)
  const pi2Date = new Date('2025-04-22')
  const pi2Taxable = 180000 // 15 ct × ₹12,000/ct
  const pi2Cgst = Math.round(pi2Taxable * 0.0075 * 100) / 100
  const pi2Sgst = Math.round(pi2Taxable * 0.0075 * 100) / 100
  const pi2Total = Math.round((pi2Taxable + pi2Cgst + pi2Sgst) * 100) / 100

  await prisma.counter.upsert({
    where: { id: 'Buy-Intra-NS' },
    update: { lastNumber: 1, year: '25-26' },
    create: { id: 'Buy-Intra-NS', lastNumber: 1, year: '25-26' }
  })

  const purchaseInv2 = await prisma.purchaseInvoice.create({
    data: {
      invoiceNo: 'P-NS/001/25-26',
      date: pi2Date,
      type: 'Intra',
      diamondType: 'Natural',
      supplierId: sup2.id,
      shipToId: companyBuyer.id,
      billToId: companyBuyer.id,
      sellerGstin: sup2.gstin,
      sellerPan: sup2.pan,
      terms: 'CREDIT',
      bankerName: sup2.bankerName,
      accountNo: sup2.accountNo,
      ifsc: sup2.ifsc,
      swiftCode: sup2.swiftCode || '',
      taxableAmount: pi2Taxable,
      cgstTotal: pi2Cgst,
      sgstTotal: pi2Sgst,
      igstTotal: 0,
      totalTax: pi2Cgst + pi2Sgst,
      amountAfterTax: pi2Taxable + pi2Cgst + pi2Sgst,
      roundOff: 0,
      totalValue: pi2Total,
      totalWords: numberToWords(pi2Total),
      declarationText: decl1.body,
      templateType: 'Standard',
      isDigitallySigned: false,
      lineItems: {
        create: [
          {
            description: 'Natural Polished Diamond, Round, VS1-SI1, G-H, GIA Certified',
            hsn: '71023100',
            quantity: 15,
            rate: 12000,
            discount: 0,
            taxableValue: 180000,
            cgstRate: 0.75,
            cgstAmount: pi2Cgst,
            sgstRate: 0.75,
            sgstAmount: pi2Sgst,
            igstRate: 0, igstAmount: 0,
            total: pi2Total
          }
        ]
      }
    }
  })

  await prisma.stockLedger.create({
    data: {
      diamondType: 'Natural',
      date: pi2Date,
      transactionType: 'PURCHASE',
      carats: 15,
      referenceId: purchaseInv2.id,
      referenceNo: 'P-NS/001/25-26',
      partyId: sup2.id,
      partyName: sup2.name,
      partyType: 'SUPPLIER'
    }
  })
  await prisma.stock.update({
    where: { diamondType: 'Natural' },
    data: { totalCarats: { increment: 15 } }
  })

  // PI 3: Inter-state, LGD from Global Diamond (40 ct)
  const pi3Date = new Date('2025-05-08')
  const pi3Taxable = 300000 // 40 ct × ₹7,500/ct
  const pi3Igst = Math.round(pi3Taxable * 0.015 * 100) / 100
  const pi3Total = Math.round((pi3Taxable + pi3Igst) * 100) / 100

  await prisma.counter.update({
    where: { id: 'Buy-Inter-LGD' },
    data: { lastNumber: 2 }
  })

  const purchaseInv3 = await prisma.purchaseInvoice.create({
    data: {
      invoiceNo: 'P-LGD/002/25-26',
      date: pi3Date,
      type: 'Inter',
      diamondType: 'LabGrown',
      supplierId: sup3.id,
      shipToId: companyBuyer.id,
      billToId: companyBuyer.id,
      sellerGstin: sup3.gstin,
      sellerPan: sup3.pan,
      terms: 'CREDIT',
      bankerName: sup3.bankerName,
      accountNo: sup3.accountNo,
      ifsc: sup3.ifsc,
      swiftCode: sup3.swiftCode || '',
      taxableAmount: pi3Taxable,
      igstTotal: pi3Igst,
      cgstTotal: 0,
      sgstTotal: 0,
      totalTax: pi3Igst,
      amountAfterTax: pi3Taxable + pi3Igst,
      roundOff: 0,
      totalValue: pi3Total,
      totalWords: numberToWords(pi3Total),
      declarationText: decl2.body,
      templateType: 'Standard',
      isDigitallySigned: false,
      lineItems: {
        create: [
          {
            description: 'Premium Round Lab Grown Diamond (HPHT), IGI Certified, VVS1-VVS2, D-E',
            hsn: '71049100',
            quantity: 40,
            rate: 7500,
            discount: 0,
            taxableValue: 300000,
            igstRate: 1.5,
            igstAmount: pi3Igst,
            cgstRate: 0, cgstAmount: 0,
            sgstRate: 0, sgstAmount: 0,
            total: pi3Total
          }
        ]
      }
    }
  })

  await prisma.stockLedger.create({
    data: {
      diamondType: 'LabGrown',
      date: pi3Date,
      transactionType: 'PURCHASE',
      carats: 40,
      referenceId: purchaseInv3.id,
      referenceNo: 'P-LGD/002/25-26',
      partyId: sup3.id,
      partyName: sup3.name,
      partyType: 'SUPPLIER'
    }
  })
  await prisma.stock.update({
    where: { diamondType: 'LabGrown' },
    data: { totalCarats: { increment: 40 } }
  })

  console.log(`  ✅ Created 3 purchase invoices (LGD: 90ct purchased, NS: 15ct purchased)`)

  // ── 7. SELL INVOICES ───────────────────────────────────────────────────────
  console.log('\n📤 Creating Sell Invoices...')

  // SI 1: Inter-state, LGD to Mehzab Jewellery (20 ct)
  const si1Date = new Date('2025-05-15')
  const si1Taxable = 200000 // 20 ct × ₹10,000/ct
  const si1Igst = Math.round(si1Taxable * 0.015 * 100) / 100
  const si1Total = Math.round((si1Taxable + si1Igst) * 100) / 100

  await prisma.counter.upsert({
    where: { id: 'Sell-Inter-LGD' },
    update: { lastNumber: 1, year: '25-26' },
    create: { id: 'Sell-Inter-LGD', lastNumber: 1, year: '25-26' }
  })

  const sellInv1 = await prisma.invoice.create({
    data: {
      invoiceNo: 'LGD/001/25-26',
      date: si1Date,
      type: 'Inter',
      diamondType: 'LabGrown',
      billedToId: party1.id,
      shippedToId: party1.id,
      gstin: profileData.gstin,
      pan: profileData.pan,
      terms: profileData.banker,
      banker: profileData.banker,
      accountNo: profileData.accountNo,
      ifsc: profileData.ifsc,
      districtOriginCode: '24',
      taxableAmount: si1Taxable,
      igstTotal: si1Igst,
      cgstTotal: 0,
      sgstTotal: 0,
      totalTax: si1Igst,
      amountAfterTax: si1Taxable + si1Igst,
      roundOff: 0,
      totalValue: si1Total,
      totalWords: numberToWords(si1Total),
      declarationText: decl2.body,
      templateType: 'Standard',
      isDigitallySigned: false,
      lineItems: {
        create: [
          {
            description: 'Round Brilliant Cut Lab Grown Diamond (CVD), IGI Certified, VS1-VVS2, E-F',
            hsn: '71049100',
            quantity: 20,
            rate: 10000,
            discount: 0,
            taxableValue: 200000,
            igstRate: 1.5,
            igstAmount: si1Igst,
            cgstRate: 0, cgstAmount: 0,
            sgstRate: 0, sgstAmount: 0,
            total: si1Total
          }
        ]
      }
    }
  })

  await prisma.stockLedger.create({
    data: {
      diamondType: 'LabGrown',
      date: si1Date,
      transactionType: 'SELL',
      carats: 20,
      referenceId: sellInv1.id,
      referenceNo: 'LGD/001/25-26',
      partyId: party1.id,
      partyName: party1.name,
      partyType: 'BUYER'
    }
  })
  await prisma.stock.update({
    where: { diamondType: 'LabGrown' },
    data: { totalCarats: { decrement: 20 } }
  })

  // SI 2: Intra-state, Natural to Hira Diamond (10 ct)
  const si2Date = new Date('2025-05-25')
  const si2Taxable = 150000 // 10 ct × ₹15,000/ct
  const si2Cgst = Math.round(si2Taxable * 0.0075 * 100) / 100
  const si2Sgst = Math.round(si2Taxable * 0.0075 * 100) / 100
  const si2Total = Math.round((si2Taxable + si2Cgst + si2Sgst) * 100) / 100

  await prisma.counter.upsert({
    where: { id: 'Sell-Intra-NS' },
    update: { lastNumber: 1, year: '25-26' },
    create: { id: 'Sell-Intra-NS', lastNumber: 1, year: '25-26' }
  })

  const sellInv2 = await prisma.invoice.create({
    data: {
      invoiceNo: 'NS/001/25-26',
      date: si2Date,
      type: 'Intra',
      diamondType: 'Natural',
      billedToId: party2.id,
      shippedToId: party2.id,
      gstin: profileData.gstin,
      pan: profileData.pan,
      terms: 'CREDIT',
      banker: profileData.banker,
      accountNo: profileData.accountNo,
      ifsc: profileData.ifsc,
      districtOriginCode: '24',
      taxableAmount: si2Taxable,
      cgstTotal: si2Cgst,
      sgstTotal: si2Sgst,
      igstTotal: 0,
      totalTax: si2Cgst + si2Sgst,
      amountAfterTax: si2Taxable + si2Cgst + si2Sgst,
      roundOff: 0,
      totalValue: si2Total,
      totalWords: numberToWords(si2Total),
      declarationText: decl1.body,
      templateType: 'Standard',
      isDigitallySigned: false,
      lineItems: {
        create: [
          {
            description: 'Natural Diamond Polished, Round, VS1-SI1, G-H-I, GIA Certified',
            hsn: '71023100',
            quantity: 10,
            rate: 15000,
            discount: 0,
            taxableValue: si2Taxable,
            cgstRate: 0.75,
            cgstAmount: si2Cgst,
            sgstRate: 0.75,
            sgstAmount: si2Sgst,
            igstRate: 0, igstAmount: 0,
            total: si2Total
          }
        ]
      }
    }
  })

  await prisma.stockLedger.create({
    data: {
      diamondType: 'Natural',
      date: si2Date,
      transactionType: 'SELL',
      carats: 10,
      referenceId: sellInv2.id,
      referenceNo: 'NS/001/25-26',
      partyId: party2.id,
      partyName: party2.name,
      partyType: 'BUYER'
    }
  })
  await prisma.stock.update({
    where: { diamondType: 'Natural' },
    data: { totalCarats: { decrement: 10 } }
  })

  // SI 3: Inter-state, LGD to Lalwani Gems (30 ct)
  const si3Date = new Date('2025-06-05')
  const si3Taxable = 360000 // 30 ct × ₹12,000/ct
  const si3Igst = Math.round(si3Taxable * 0.015 * 100) / 100
  const si3Total = Math.round((si3Taxable + si3Igst) * 100) / 100

  await prisma.counter.update({
    where: { id: 'Sell-Inter-LGD' },
    data: { lastNumber: 2 }
  })

  const sellInv3 = await prisma.invoice.create({
    data: {
      invoiceNo: 'LGD/002/25-26',
      date: si3Date,
      type: 'Inter',
      diamondType: 'LabGrown',
      billedToId: party3.id,
      shippedToId: party3.id,
      gstin: profileData.gstin,
      pan: profileData.pan,
      terms: 'CREDIT',
      banker: profileData.banker,
      accountNo: profileData.accountNo,
      ifsc: profileData.ifsc,
      districtOriginCode: '24',
      taxableAmount: si3Taxable,
      igstTotal: si3Igst,
      cgstTotal: 0,
      sgstTotal: 0,
      totalTax: si3Igst,
      amountAfterTax: si3Taxable + si3Igst,
      roundOff: 0,
      totalValue: si3Total,
      totalWords: numberToWords(si3Total),
      declarationText: decl2.body,
      templateType: 'Standard',
      isDigitallySigned: false,
      lineItems: {
        create: [
          {
            description: 'Fancy Shape Lab Grown Diamond (CVD), Oval/Pear/Cushion Mix, IGI, VS2-SI1, F-G',
            hsn: '71049100',
            quantity: 18,
            rate: 12000,
            discount: 0,
            taxableValue: 216000,
            igstRate: 1.5,
            igstAmount: Math.round(216000 * 0.015 * 100) / 100,
            cgstRate: 0, cgstAmount: 0,
            sgstRate: 0, sgstAmount: 0,
            total: Math.round(216000 * 1.015 * 100) / 100
          },
          {
            description: 'Round Brilliant Lab Grown Diamond (CVD), IGI Certified, VVS1, D-E',
            hsn: '71049100',
            quantity: 12,
            rate: 12000,
            discount: 0,
            taxableValue: 144000,
            igstRate: 1.5,
            igstAmount: Math.round(144000 * 0.015 * 100) / 100,
            cgstRate: 0, cgstAmount: 0,
            sgstRate: 0, sgstAmount: 0,
            total: Math.round(144000 * 1.015 * 100) / 100
          }
        ]
      }
    }
  })

  await prisma.stockLedger.create({
    data: {
      diamondType: 'LabGrown',
      date: si3Date,
      transactionType: 'SELL',
      carats: 30,
      referenceId: sellInv3.id,
      referenceNo: 'LGD/002/25-26',
      partyId: party3.id,
      partyName: party3.name,
      partyType: 'BUYER'
    }
  })
  await prisma.stock.update({
    where: { diamondType: 'LabGrown' },
    data: { totalCarats: { decrement: 30 } }
  })

  // SI 4: Inter-state, LGD to Sterling Diamond (Large invoice)
  const si4Date = new Date('2025-06-18')
  const si4Taxable = 500000 // 25 ct × ₹20,000/ct
  const si4Igst = Math.round(si4Taxable * 0.015 * 100) / 100
  const si4Total = Math.round((si4Taxable + si4Igst) * 100) / 100

  await prisma.counter.update({
    where: { id: 'Sell-Inter-LGD' },
    data: { lastNumber: 3 }
  })

  const sellInv4 = await prisma.invoice.create({
    data: {
      invoiceNo: 'LGD/003/25-26',
      date: si4Date,
      type: 'Inter',
      diamondType: 'LabGrown',
      billedToId: party4.id,
      shippedToId: party4.id,
      gstin: profileData.gstin,
      pan: profileData.pan,
      terms: 'CREDIT',
      banker: profileData.banker,
      accountNo: profileData.accountNo,
      ifsc: profileData.ifsc,
      districtOriginCode: '24',
      taxableAmount: si4Taxable,
      igstTotal: si4Igst,
      cgstTotal: 0,
      sgstTotal: 0,
      totalTax: si4Igst,
      amountAfterTax: si4Taxable + si4Igst,
      roundOff: 0,
      totalValue: si4Total,
      totalWords: numberToWords(si4Total),
      declarationText: decl2.body,
      templateType: 'Standard',
      isDigitallySigned: false,
      lineItems: {
        create: [
          {
            description: 'Premium Round Brilliant Lab Grown Diamond (CVD), IGI, VVS1-VVS2, D-E-F',
            hsn: '71049100',
            quantity: 25,
            rate: 20000,
            discount: 0,
            taxableValue: 500000,
            igstRate: 1.5,
            igstAmount: si4Igst,
            cgstRate: 0, cgstAmount: 0,
            sgstRate: 0, sgstAmount: 0,
            total: si4Total
          }
        ]
      }
    }
  })

  await prisma.stockLedger.create({
    data: {
      diamondType: 'LabGrown',
      date: si4Date,
      transactionType: 'SELL',
      carats: 25,
      referenceId: sellInv4.id,
      referenceNo: 'LGD/003/25-26',
      partyId: party4.id,
      partyName: party4.name,
      partyType: 'BUYER'
    }
  })
  await prisma.stock.update({
    where: { diamondType: 'LabGrown' },
    data: { totalCarats: { decrement: 25 } }
  })

  console.log(`  ✅ Created 4 sell invoices (LGD: 75ct sold, NS: 10ct sold)`)

  // ── 8. AUDIT LOGS ──────────────────────────────────────────────────────────
  console.log('\n📋 Creating initial Audit Logs...')
  await prisma.auditLog.createMany({
    data: [
      { username: 'admin', role: 'ADMIN', action: 'LOGIN', entityType: 'PROFILE', details: 'Admin logged in - initial setup' },
      { username: 'admin', role: 'ADMIN', action: 'CREATE', entityType: 'INVOICE', entityId: sellInv1.id.toString(), details: `Created invoice LGD/001/25-26 (₹${si1Total.toLocaleString()})` },
      { username: 'admin', role: 'ADMIN', action: 'CREATE', entityType: 'INVOICE', entityId: sellInv2.id.toString(), details: `Created invoice NS/001/25-26 (₹${si2Total.toLocaleString()})` },
      { username: 'operator', role: 'OPERATOR', action: 'LOGIN', entityType: 'PROFILE', details: 'Operator logged in' },
      { username: 'operator', role: 'OPERATOR', action: 'CREATE', entityType: 'INVOICE', entityId: sellInv3.id.toString(), details: `Created invoice LGD/002/25-26 (₹${si3Total.toLocaleString()})` },
      { username: 'accountant', role: 'ACCOUNTANT', action: 'LOGIN', entityType: 'PROFILE', details: 'Accountant logged in' },
      { username: 'admin', role: 'ADMIN', action: 'CREATE', entityType: 'PURCHASE_INVOICE', entityId: purchaseInv1.id.toString(), details: `Created purchase invoice P-LGD/001/25-26 (₹${pi1Total.toLocaleString()})` },
      { username: 'operator', role: 'OPERATOR', action: 'PRINT', entityType: 'INVOICE', entityId: sellInv1.id.toString(), details: 'Downloaded PDF using Standard template (Digital Signature: ON)' },
    ]
  })
  console.log(`  ✅ Created 8 audit log entries`)

  // ── 9. SUMMARY ─────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60))
  console.log('✅ DEMO DATA SEEDED SUCCESSFULLY')
  console.log('═'.repeat(60))
  console.log('\n📊 Stock Summary:')
  const lgdStock = await prisma.stock.findUnique({ where: { diamondType: 'LabGrown' } })
  const nsStock = await prisma.stock.findUnique({ where: { diamondType: 'Natural' } })
  console.log(`  Lab Grown (LGD): Purchased 90ct | Sold 75ct | Balance: ${lgdStock?.totalCarats}ct`)
  console.log(`  Natural (NS):    Purchased 15ct | Sold 10ct | Balance: ${nsStock?.totalCarats}ct`)
  console.log('\n📄 Invoices:')
  console.log('  Sell Invoices:     4 (LGD/001, NS/001, LGD/002, LGD/003)')
  console.log('  Purchase Invoices: 3 (P-LGD/001, P-NS/001, P-LGD/002)')
  console.log('\n👥 Parties:')
  console.log('  Sell Parties:  4 (Mehzab, Hira, Lalwani, Sterling)')
  console.log('  Suppliers:     3 (Prism, Kiran, Global Diamond)')
  console.log('  Buyers:        3 (Shakti Exports [company], Rajkot, Pune)')
  console.log('\n💰 Outstanding for Reconciliation:')
  console.log(`  Mehzab Jewellery:       ₹${si1Total.toLocaleString()} (Sell Invoice LGD/001)`)
  console.log(`  Hira Diamond Company:   ₹${si2Total.toLocaleString()} (Sell Invoice NS/001)`)
  console.log(`  Lalwani Gems:           ₹${si3Total.toLocaleString()} (Sell Invoice LGD/002)`)
  console.log(`  Sterling Diamond:       ₹${si4Total.toLocaleString()} (Sell Invoice LGD/003)`)
  console.log(`  Prism Diamond LLP:      ₹${pi1Total.toLocaleString()} (Purchase Invoice P-LGD/001)`)
  console.log(`  Kiran Gems Pvt Ltd:     ₹${pi2Total.toLocaleString()} (Purchase Invoice P-NS/001)`)
  console.log(`  Global Diamond Corp:    ₹${pi3Total.toLocaleString()} (Purchase Invoice P-LGD/002)`)
  console.log('\n🔑 Login Credentials:')
  console.log('  admin       / admin123        (ADMIN - full access)')
  console.log('  accountant  / accountant123   (ACCOUNTANT - invoices + reconciliation)')
  console.log('  operator    / operator123     (OPERATOR - invoices only)')
  console.log('\n🚀 Dev server: http://localhost:3000')
}

main()
  .catch((e) => {
    console.error('\n❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
