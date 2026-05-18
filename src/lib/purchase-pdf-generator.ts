import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { format } from 'date-fns'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable: { finalY: number }
  }
}

const fmt = (n: number) => n.toFixed(2)
const fmtN = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function generatePurchaseInvoicePDF(invoice: any) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pw = doc.internal.pageSize.getWidth()
  const ml = 8, mr = 8
  const cw = pw - ml - mr
  const mid = ml + cw / 2

  const setB = () => doc.setFont('helvetica', 'bold')
  const setN = () => doc.setFont('helvetica', 'normal')
  const hline = (y: number, x1 = ml, x2 = ml + cw, lw = 0.2) => { doc.setLineWidth(lw); doc.line(x1, y, x2, y) }
  const vline = (x: number, y1: number, y2: number, lw = 0.2) => { doc.setLineWidth(lw); doc.line(x, y1, x, y2) }
  const box = (x: number, y: number, w: number, h: number, lw = 0.3) => { doc.setLineWidth(lw); doc.rect(x, y, w, h) }
  const cell = (txt: string, x: number, y: number, bold = false, align: 'left' | 'right' | 'center' = 'left') => {
    bold ? setB() : setN(); doc.text(txt, x, y, { align })
  }

  let y = 8

  // ── Title ──────────────────────────────────────────────────────────────────
  setB(); doc.setFontSize(13)
  doc.text('Tax Invoice', pw / 2, y + 6, { align: 'center' })
  doc.setFontSize(8); setN()
  doc.text('(Purchase)', pw / 2, y + 11, { align: 'center' })
  y += 14

  // ── TOP GRID: Seller left, Invoice meta right ──────────────────────────────
  const topH = 40
  box(ml, y, cw, topH, 0.35)
  vline(mid, y, y + topH)

  // Seller (Supplier) details - left
  const sup = invoice.supplier
  setB(); doc.setFontSize(10)
  doc.text(sup.name.toUpperCase(), ml + 3, y + 6)
  setN(); doc.setFontSize(8)
  const supAddr = doc.splitTextToSize(`${sup.address}, ${sup.city}`, cw / 2 - 10)
  doc.text(supAddr, ml + 3, y + 11)
  let sly = y + 11 + supAddr.length * 4
  doc.text(`GSTIN/UIN: ${sup.gstin}`, ml + 3, sly)
  sly += 4
  doc.text(`State: ${sup.state}, Code: ${sup.stateCode}`, ml + 3, sly)

  // Invoice meta - right
  const cells = [
    ['Invoice No.', invoice.invoiceNo],
    ['Dated', format(new Date(invoice.date), 'dd-MMM-yy').toUpperCase()],
    ['Mode/Terms', invoice.terms || ''],
    ['Diamond Type', invoice.diamondType === 'LabGrown' ? 'Lab Grown (CVD)' : 'Natural Diamond'],
    // ['Tax Type', invoice.type === 'Intra' ? 'Intra (IGST)' : 'Inter (CGST+SGST)'],
  ]
  const rowH = topH / cells.length
  cells.forEach((pair, i) => {
    const cy = y + i * rowH
    if (i > 0) hline(cy, mid, ml + cw)
    const lx = mid + 3, rx = ml + cw - 3
    doc.setFontSize(7.5); setN()
    doc.text(pair[0], lx, cy + 4)
    doc.setFontSize(8); setB()
    doc.text(pair[1], rx, cy + 4, { align: 'right' })
  })

  y += topH

  // ── PARTIES: Ship To + Bill To on Left, Right Empty ──────────────────
  const partyH = 45
  box(ml, y, cw, partyH, 0.3)
  vline(mid, y, y + partyH)

  // LEFT SIDE WIDTH
  const leftX = ml
  const leftW = cw / 2

  // Divider between Ship To and Bill To
  const halfPartyH = partyH / 2
  hline(y + halfPartyH, leftX, mid)

  // RIGHT SIDE EMPTY WITH TERMS
  setN()
  doc.setFontSize(8)
  doc.text('Terms of Delivery', mid + 3, y + 5)

  // PARTY RENDER FUNCTION
  const renderParty = (
    party: any,
    x: number,
    startY: number,
    label: string
  ) => {
    if (!party) return

    setN()
    doc.setFontSize(7)
    doc.text(label.toUpperCase(), x + 2, startY + 4)

    setB()
    doc.setFontSize(9)
    doc.text(party.name.toUpperCase(), x + 2, startY + 9)

    setN()
    doc.setFontSize(8)

    const addr = doc.splitTextToSize(
      `${party.address}, ${party.city}`,
      leftW - 8
    )

    doc.text(addr, x + 2, startY + 14)

    let py = startY + 14 + addr.length * 3.5

    doc.text(`GSTIN/UIN: ${party.gstin}`, x + 2, py)
    py += 3.5

    doc.text(`State: ${party.state}, Code: ${party.stateCode}`, x + 2, py)
  }

  // TOP LEFT → SHIP TO
  renderParty(
    invoice.shipTo,
    ml,
    y,
    'Consignee (Ship to)'
  )

  // BOTTOM LEFT → BILL TO
  renderParty(
    invoice.billTo,
    ml,
    y + halfPartyH,
    'Buyer (Bill to)'
  )

  y += partyH

  // ── TERMS ROW ─────────────────────────────────────────────────────────────
  const termsH = 7
  box(ml, y, cw, termsH, 0.2)
  setN(); doc.setFontSize(8)
  doc.text(`Terms of Delivery: `, ml + 3, y + 5)
  setB(); doc.text(invoice.terms || 'As per agreement', ml + 35, y + 5)
  y += termsH

  // ── PRODUCT TABLE ─────────────────────────────────────────────────────────
  const isIGST = invoice.type === 'Intra'

  let headRows: any[][]
  if (isIGST) {
    headRows = [[
      { content: 'Sl No.', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'Description of Goods', rowSpan: 2, styles: { valign: 'middle', halign: 'left' } },
      { content: 'HSN/SAC', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'Qty (Cts)', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'Rate', rowSpan: 2, styles: { valign: 'middle', halign: 'right' } },
      { content: 'Amount', rowSpan: 2, styles: { valign: 'middle', halign: 'right' } },
      { content: 'IGST', colSpan: 2, styles: { halign: 'center' } },
      { content: 'Total', rowSpan: 2, styles: { valign: 'middle', halign: 'right' } },
    ], ['Rate %', 'Amount']]
  } else {
    headRows = [[
      { content: 'Sl No.', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'Description of Goods', rowSpan: 2, styles: { valign: 'middle', halign: 'left' } },
      { content: 'HSN/SAC', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'Qty (Cts)', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'Rate', rowSpan: 2, styles: { valign: 'middle', halign: 'right' } },
      { content: 'Amount', rowSpan: 2, styles: { valign: 'middle', halign: 'right' } },
      { content: 'CGST', colSpan: 2, styles: { halign: 'center' } },
      { content: 'SGST/UTGST', colSpan: 2, styles: { halign: 'center' } },
      { content: 'Total', rowSpan: 2, styles: { valign: 'middle', halign: 'right' } },
    ], ['Rate', 'Amount', 'Rate', 'Amount']]
  }

  const bodyRows = (invoice.lineItems || []).map((item: any, idx: number) => {
    const amount = item.quantity * item.rate
    if (isIGST) {
      return [
        idx + 1,
        { content: item.description, styles: { halign: 'left' } },
        item.hsn,
        fmt(item.quantity),
        fmtN(item.rate),
        fmtN(amount),
        `${fmt(item.igstRate)}%`,
        fmtN(item.igstAmount),
        fmtN(item.total),
      ]
    } else {
      return [
        idx + 1,
        { content: item.description, styles: { halign: 'left' } },
        item.hsn,
        fmt(item.quantity),
        fmtN(item.rate),
        fmtN(amount),
        `${fmt(item.cgstRate)}%`,
        fmtN(item.cgstAmount),
        `${fmt(item.sgstRate)}%`,
        fmtN(item.sgstAmount),
        fmtN(item.total),
      ]
    }
  })

  // Pad to 5 rows
  const colCount = isIGST ? 9 : 11
  while (bodyRows.length < 5) bodyRows.push(Array(colCount).fill(''))

  // Total row
  const totalQty = (invoice.lineItems || []).reduce((s: number, i: any) => s + i.quantity, 0)
  const totalAmount = (invoice.lineItems || []).reduce((s: number, i: any) => s + i.quantity * i.rate, 0)
  let footRow: any[]
  if (isIGST) {
    footRow = [
      { content: 'Total', colSpan: 3, styles: { halign: 'left', fontStyle: 'bold' } },
      { content: fmt(totalQty), styles: { fontStyle: 'bold' } },
      '',
      { content: fmtN(totalAmount), styles: { fontStyle: 'bold' } },
      '',
      { content: fmtN(invoice.igstTotal), styles: { fontStyle: 'bold' } },
      { content: fmtN(invoice.totalValue), styles: { fontStyle: 'bold' } },
    ]
  } else {
    footRow = [
      { content: 'Total', colSpan: 3, styles: { halign: 'left', fontStyle: 'bold' } },
      { content: fmt(totalQty), styles: { fontStyle: 'bold' } },
      '',
      { content: fmtN(totalAmount), styles: { fontStyle: 'bold' } },
      '',
      { content: fmtN(invoice.cgstTotal), styles: { fontStyle: 'bold' } },
      '',
      { content: fmtN(invoice.sgstTotal), styles: { fontStyle: 'bold' } },
      { content: fmtN(invoice.totalValue), styles: { fontStyle: 'bold' } },
    ]
  }

  doc.autoTable({
    startY: y,
    head: headRows,
    body: bodyRows,
    foot: [footRow],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: { top: 2, bottom: 2, left: 2, right: 2 }, lineColor: [0, 0, 0], lineWidth: 0.15, textColor: [0, 0, 0], halign: 'center', valign: 'middle' },
    headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 7.5, lineWidth: 0.2 },
    footStyles: { fillColor: [249, 249, 249], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.2 },
    columnStyles: isIGST
      ? { 0: { cellWidth: 10 }, 1: { cellWidth: 55, halign: 'left' }, 2: { cellWidth: 20 }, 3: { cellWidth: 16 }, 4: { cellWidth: 20 }, 5: { cellWidth: 22 }, 6: { cellWidth: 12 }, 7: { cellWidth: 18 }, 8: { cellWidth: 21 } }
      : { 0: { cellWidth: 8 }, 1: { cellWidth: 40, halign: 'left' }, 2: { cellWidth: 16 }, 3: { cellWidth: 14 }, 4: { cellWidth: 16 }, 5: { cellWidth: 18 }, 6: { cellWidth: 10 }, 7: { cellWidth: 14 }, 8: { cellWidth: 10 }, 9: { cellWidth: 14 }, 10: { cellWidth: 18 } },
    showFoot: 'lastPage',
    margin: { left: ml, right: mr }
  })

  let finalY = doc.lastAutoTable.finalY

  // ── Amount in words ────────────────────────────────────────────────────────
  const awH = 12
  box(ml, finalY, cw, awH, 0.2)
  setN(); doc.setFontSize(7); doc.text('Amount Chargeable (in words)', ml + 3, finalY + 4)
  setB(); doc.setFontSize(8.5)
  const wordLines = doc.splitTextToSize((invoice.totalWords || '').toUpperCase(), cw - 50)
  doc.text(wordLines, ml + 3, finalY + 8)
  doc.setFontSize(7.5); setN(); doc.text('E. & O.E', ml + cw - 3, finalY + 8, { align: 'right' })
  finalY += awH

  // ── HSN Tax Summary ────────────────────────────────────────────────────────
  const summaryHead = isIGST
    ? [['HSN/SAC', 'Taxable Value', 'IGST Rate', 'IGST Amount', 'Total Tax Amount']]
    : [
      [
        { content: 'HSN/SAC', rowSpan: 2, styles: { valign: 'middle' } },
        { content: 'Taxable Value', rowSpan: 2, styles: { valign: 'middle' } },
        { content: 'CGST', colSpan: 2, styles: { halign: 'center' } },
        { content: 'SGST/UTGST', colSpan: 2, styles: { halign: 'center' } },
        { content: 'Total Tax Amount', rowSpan: 2, styles: { valign: 'middle' } },
      ],
      ['Rate', 'Amount', 'Rate', 'Amount']
    ]

  const summaryBody = (invoice.lineItems || []).map((item: any) => {
    if (isIGST) return [item.hsn, fmtN(item.taxableValue), `${fmt(item.igstRate)}%`, fmtN(item.igstAmount), fmtN(item.igstAmount)]
    return [item.hsn, fmtN(item.taxableValue), `${fmt(item.cgstRate)}%`, fmtN(item.cgstAmount), `${fmt(item.sgstRate)}%`, fmtN(item.sgstAmount), fmtN(item.cgstAmount + item.sgstAmount)]
  })
  const summaryFoot = isIGST
    ? [[{ content: 'Total', styles: { fontStyle: 'bold' } }, fmtN(invoice.taxableAmount), '', fmtN(invoice.igstTotal), fmtN(invoice.igstTotal)]]
    : [[{ content: 'Total', styles: { fontStyle: 'bold' } }, fmtN(invoice.taxableAmount), '', fmtN(invoice.cgstTotal), '', fmtN(invoice.sgstTotal), fmtN(invoice.totalTax)]]

  doc.autoTable({
    startY: finalY,
    head: summaryHead,
    body: summaryBody,
    foot: summaryFoot,
    theme: 'grid',
    styles: { fontSize: 7.5, lineColor: [0, 0, 0], lineWidth: 0.15, halign: 'center' },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' },
    margin: { left: ml, right: mr }
  })

  finalY = doc.lastAutoTable.finalY

  // ── Tax in words ───────────────────────────────────────────────────────────
  box(ml, finalY, cw, 8, 0.2)
  setN(); doc.setFontSize(7.5)
  doc.text('Tax Amount (in words)  :  ', ml + 3, finalY + 5)
  setB()
  const taxNum = Math.round(invoice.totalTax)
  doc.text(`INR ${taxNum.toLocaleString('en-IN')} Only`, ml + 50, finalY + 5)
  finalY += 8

  // ── Bank Details + Signatory ───────────────────────────────────────────────
  const bankH = 28
  box(ml, finalY, cw, bankH, 0.3)
  vline(mid, finalY, finalY + bankH)

  setB(); doc.setFontSize(8.5)
  doc.text("Company's Bank Details", ml + cw / 4, finalY + 5, { align: 'center' })
  hline(finalY + 7, ml, mid)
  doc.setFontSize(8); setN()
  const bankRows = [
    ["A/c Holder's Name", sup.name],
    ['Bank Name', invoice.bankerName || 'N/A'],
    ['A/c No.', invoice.accountNo || 'N/A'],
    ['IFSC / SWIFT', `${invoice.ifsc || 'N/A'} ${invoice.swiftCode ? '/ ' + invoice.swiftCode : ''}`],
  ]
  bankRows.forEach((row, i) => {
    const by = finalY + 11 + i * 4
    setN(); doc.setFontSize(7.5); doc.text(row[0], ml + 3, by)
    doc.text(': ', mid - 25, by)
    setB(); doc.text(row[1], mid - 22, by)
  })

  // Signatory right
  setB(); doc.setFontSize(8.5); doc.text(`for ${sup.name.toUpperCase()}`, mid + cw / 4, finalY + 5, { align: 'center' })
  setN(); doc.setFontSize(8)
  doc.text('Authorised Signatory', mid + cw / 4, finalY + bankH - 3, { align: 'center' })

  finalY += bankH

  // ── PAN + Declaration ──────────────────────────────────────────────────────
  const panH = 18
  box(ml, finalY, cw, panH, 0.2)
  vline(mid, finalY, finalY + panH)

  setN(); doc.setFontSize(7); doc.text("Company's PAN", ml + 3, finalY + 4)
  setB(); doc.setFontSize(11); doc.text(`: ${sup.pan}`, ml + 3, finalY + 10)
  setN(); doc.setFontSize(7.5)
  doc.text('Declaration', mid + 3, finalY + 4)
  doc.setFontSize(7)
  const decLines = doc.splitTextToSize(invoice.declarationText || 'We declare that this invoice shows the actual price of the goods.', cw / 2 - 6)
  doc.text(decLines, mid + 3, finalY + 8)

  finalY += panH

  // ── Footer ─────────────────────────────────────────────────────────────────
  setN(); doc.setFontSize(7); doc.setTextColor(80)
  // doc.text('This is a Computer Generated Invoice', pw / 2, finalY + 5, { align: 'center' })

  return doc
}
