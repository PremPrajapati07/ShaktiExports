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

export function generateInvoicePDF(invoice: any) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pw = doc.internal.pageSize.getWidth()  // 210
  const ph = doc.internal.pageSize.getHeight() // 297
  const ml = 8   // margin left
  const mr = 8   // margin right
  const cw = pw - ml - mr  // content width ~194mm
  const mid = ml + cw / 2

  // ─── helpers ──────────────────────────────────────────────────────────────
  const setB = () => doc.setFont('helvetica', 'bold')
  const setN = () => doc.setFont('helvetica', 'normal')
  const hline = (y: number, x1 = ml, x2 = ml + cw, lw = 0.2) => {
    doc.setLineWidth(lw); doc.line(x1, y, x2, y)
  }
  const vline = (x: number, y1: number, y2: number, lw = 0.2) => {
    doc.setLineWidth(lw); doc.line(x, y1, x, y2)
  }
  const box = (x: number, y: number, w: number, h: number, lw = 0.3) => {
    doc.setLineWidth(lw); doc.rect(x, y, w, h)
  }
  const cell = (txt: string, x: number, y: number, bold = false, align: 'left'|'right'|'center' = 'left') => {
    bold ? setB() : setN()
    doc.text(txt, x, y, { align })
  }

  let y = 8

  // ─── 1. HEADER ─────────────────────────────────────────────────────────────
  // Diamond logo
  doc.setLineWidth(0.5)
  const lx = ml + 3, ly = y, ls = 16
  const pts: [number,number][] = [
    [lx+ls/2, ly], [lx+ls, ly+ls*0.35], [lx+ls*0.8, ly+ls],
    [lx+ls*0.2, ly+ls], [lx, ly+ls*0.35]
  ]
  for (let i = 0; i < pts.length; i++) {
    const [x1,y1] = pts[i]; const [x2,y2] = pts[(i+1)%pts.length]
    doc.line(x1, y1, x2, y2)
  }
  doc.setLineWidth(0.2)
  doc.line(lx, ly+ls*0.35, lx+ls, ly+ls*0.35)   // horizontal belt
  doc.line(lx+ls/2, ly, lx+ls*0.2, ly+ls*0.35)  // inner facets
  doc.line(lx+ls/2, ly, lx+ls*0.8, ly+ls*0.35)
  doc.line(lx+ls*0.2, ly+ls*0.35, lx+ls/2, ly+ls)
  doc.line(lx+ls*0.8, ly+ls*0.35, lx+ls/2, ly+ls)

  // Brand text
  const bx = ml + ls + 8
  doc.setTextColor(0)
  setB(); doc.setFontSize(22); doc.text('SHAKTI', bx, y + 7)
  doc.setFontSize(13); doc.text('EXPORTS', bx, y + 13)
  setN(); doc.setFontSize(6.5); doc.text('ADORN YOUR DREAM', bx, y + 17)
  hline(y + 19, bx, bx + 78, 0.2)
  doc.setFontSize(6); doc.text('DIAMOND MANUFACTURER | EXPORTER | IMPORTER', bx, y + 22)

  // Invoice No top right
  setB(); doc.setFontSize(9)
  doc.text(invoice.invoiceNo, pw - mr, y + 5, { align: 'right' })

  y += 26

  // ─── 2. TAX INVOICE TITLE ──────────────────────────────────────────────────
  box(ml, y, cw, 9, 0.4)
  setB(); doc.setFontSize(13)
  doc.text('Tax Invoice', pw / 2, y + 6.5, { align: 'center' })
  y += 9

  // ─── 3. INFO GRID (Invoice details + Banker) ───────────────────────────────
  const infoH = invoice.type === 'Inter' ? 23 : 20
  box(ml, y, cw, infoH, 0.3)
  vline(mid, y, y + infoH, 0.2)

  doc.setFontSize(8)
  const lp = ml + 2   // left padding
  const rp = mid + 2  // right section start

  let iy = y + 5
  cell('Invoice No:', lp, iy, true); cell(invoice.invoiceNo, lp + 22, iy)
  iy += 4
  cell('Invoice Date:', lp, iy, true); cell(format(new Date(invoice.date), 'dd/MM/yyyy'), lp + 22, iy)
  iy += 4
  cell('GSTIN:', lp, iy, true); cell(invoice.gstin, lp + 13, iy)
  cell('PAN NO.:', lp + 65, iy, true); cell(invoice.pan, lp + 80, iy)
  iy += 4
  cell('Terms:', lp, iy, true); cell(invoice.terms || '', lp + 13, iy)
  if (invoice.type === 'Inter') {
    iy += 4
    cell('District Origin Code:', lp, iy, true); cell(invoice.districtOriginCode || '', lp + 33, iy)
  }

  iy = y + 5
  cell('Our Banker:', rp, iy, true)
  doc.setFontSize(7.5); setN()
  const bankerText = invoice.banker || ''
  const bankerLines = doc.splitTextToSize(bankerText, (cw/2) - 25)
  doc.text(bankerLines, rp + 20, iy)
  doc.setFontSize(8)
  iy += (bankerLines.length > 1 ? 8 : 4)
  cell('A/c.No.:', rp, iy, true); cell(invoice.accountNo || '', rp + 15, iy)
  iy += 4
  cell('RTGS/NEFT IFSC:', rp, iy, true); cell(invoice.ifsc || '', rp + 27, iy)

  y += infoH
  hline(y, ml, ml + cw, 0.3)

  // ─── 4. PARTY BLOCK ────────────────────────────────────────────────────────
  const partyH = 38
  box(ml, y, cw, partyH, 0.3)
  vline(mid, y, y + partyH, 0.2)

  // Header labels
  setB(); doc.setFontSize(8)
  doc.text('Details of Receiver (Billed to)', ml + cw/4, y + 4, { align: 'center' })
  doc.text('Details of Consignee (Shipped to)', mid + cw/4, y + 4, { align: 'center' })
  hline(y + 6, ml, ml + cw, 0.2)

  const billed = invoice.billedTo
  const shipped = invoice.shippedTo
  const pTop = y + 10

  // Billed To
  setB(); doc.setFontSize(9); doc.text(billed.name.toUpperCase(), lp, pTop)
  setN(); doc.setFontSize(8)
  const bAddr = doc.splitTextToSize(billed.address, (cw/2) - 8)
  doc.text(bAddr, lp, pTop + 5)
  hline(y + 28, ml, mid, 0.15)
  setB(); doc.setFontSize(7.5)
  cell(`State: ${billed.state}`, lp, y + 32, true)
  cell(`Code: ${billed.stateCode}`, mid - 20, y + 32, true)
  hline(y + 34, ml, mid, 0.15)
  cell('GSTIN:', lp, y + 37, true); setN(); doc.text(billed.gstin, lp + 12, y + 37)
  cell('   PAN:', lp + 40, y + 37, true); doc.text(billed.pan || '', lp + 52, y + 37)

  // Shipped To
  setB(); doc.setFontSize(9); doc.text(shipped.name.toUpperCase(), mid + 2, pTop)
  setN(); doc.setFontSize(8)
  const sAddr = doc.splitTextToSize(shipped.address, (cw/2) - 8)
  doc.text(sAddr, mid + 2, pTop + 5)
  hline(y + 28, mid, ml + cw, 0.15)
  setB(); doc.setFontSize(7.5)
  cell(`State: ${shipped.state}`, mid + 2, y + 32, true)
  cell(`Code: ${shipped.stateCode}`, ml + cw - 20, y + 32, true)
  hline(y + 34, mid, ml + cw, 0.15)
  cell('GSTIN:', mid + 2, y + 37, true); setN(); doc.text(shipped.gstin || '', mid + 14, y + 37)

  y += partyH

  // ─── 5. PRODUCT TABLE ──────────────────────────────────────────────────────
  const isIntra = invoice.type === 'Intra'

  // Build head rows
  let headRows: any[][]
  if (isIntra) {
    headRows = [
      [
        { content: 'Sr.\nNo.', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Product Description', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'HSN\nCode', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Qty\n(Cts)', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Rate', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Taxable\nValue', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'CGST', colSpan: 2, styles: { halign: 'center' } },
        { content: 'SGST', colSpan: 2, styles: { halign: 'center' } },
        { content: 'Total', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      ],
      ['Rate %', 'Amount', 'Rate %', 'Amount']
    ]
  } else {
    headRows = [
      [
        { content: 'Sr.\nNo.', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Product Description', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'HSN\nCode', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Qty\n(Cts)', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Rate', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Amount', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Discount', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Taxable\nValue', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'IGST', colSpan: 2, styles: { halign: 'center' } },
        { content: 'Total', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      ],
      ['Rate %', 'Amount']
    ]
  }

  // Build body rows
  const bodyRows = invoice.lineItems.map((item: any, idx: number) => {
    if (isIntra) {
      return [
        idx + 1,
        { content: item.description, styles: { halign: 'left' } },
        item.hsn,
        fmt(item.quantity),
        fmtN(item.rate),
        fmtN(item.taxableValue),
        `${fmt(item.cgstRate)}%`,
        fmtN(item.cgstAmount),
        `${fmt(item.sgstRate)}%`,
        fmtN(item.sgstAmount),
        fmtN(item.total),
      ]
    } else {
      const amount = item.quantity * item.rate
      return [
        idx + 1,
        { content: item.description, styles: { halign: 'left' } },
        item.hsn,
        fmt(item.quantity),
        fmtN(item.rate),
        fmtN(amount),
        fmtN(item.discount),
        fmtN(item.taxableValue),
        `${fmt(item.igstRate)}%`,
        fmtN(item.igstAmount),
        fmtN(item.total),
      ]
    }
  })

  // Pad with empty rows (minimum 5 rows visible)
  const minRows = 5
  const colCount = isIntra ? 11 : 11
  while (bodyRows.length < minRows) {
    bodyRows.push(Array(colCount).fill(''))
  }

  // Totals footer row
  const totalQty = invoice.lineItems.reduce((s: number, i: any) => s + i.quantity, 0)
  const totalTaxable = invoice.taxableAmount
  let footRow: any[]
  if (isIntra) {
    const totalCgst = invoice.cgstTotal
    const totalSgst = invoice.sgstTotal
    footRow = [
      { content: 'Total', colSpan: 3, styles: { halign: 'left', fontStyle: 'bold', fontSize: 10 } },
      { content: fmt(totalQty), styles: { fontStyle: 'bold' } },
      '',
      { content: fmtN(totalTaxable), styles: { fontStyle: 'bold' } },
      '',
      { content: fmtN(totalCgst), styles: { fontStyle: 'bold' } },
      '',
      { content: fmtN(totalSgst), styles: { fontStyle: 'bold' } },
      { content: fmtN(invoice.totalValue), styles: { fontStyle: 'bold' } },
    ]
  } else {
    const totalAmount = invoice.lineItems.reduce((s: number, i: any) => s + i.quantity * i.rate, 0)
    const totalDiscount = invoice.lineItems.reduce((s: number, i: any) => s + i.discount, 0)
    const totalIgst = invoice.igstTotal
    footRow = [
      { content: 'Total', colSpan: 3, styles: { halign: 'left', fontStyle: 'bold', fontSize: 10 } },
      { content: fmt(totalQty), styles: { fontStyle: 'bold' } },
      '',
      { content: fmtN(totalAmount), styles: { fontStyle: 'bold' } },
      { content: fmtN(totalDiscount), styles: { fontStyle: 'bold' } },
      { content: fmtN(totalTaxable), styles: { fontStyle: 'bold' } },
      '',
      { content: fmtN(totalIgst), styles: { fontStyle: 'bold' } },
      { content: fmtN(invoice.totalValue), styles: { fontStyle: 'bold' } },
    ]
  }

  doc.autoTable({
    startY: y,
    head: headRows,
    body: bodyRows,
    foot: [footRow],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 },
      lineColor: [0, 0, 0],
      lineWidth: 0.15,
      textColor: [0, 0, 0],
      halign: 'center',
      valign: 'middle',
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 7.5,
      lineWidth: 0.2
    },
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.2
    },
    columnStyles: isIntra
      ? {
          0: { cellWidth: 8 },
          1: { cellWidth: 40, halign: 'left' },
          2: { cellWidth: 18 },
          3: { cellWidth: 14 },
          4: { cellWidth: 18 },
          5: { cellWidth: 20 },
          6: { cellWidth: 12 },
          7: { cellWidth: 17 },
          8: { cellWidth: 12 },
          9: { cellWidth: 17 },
          10: { cellWidth: 18 },
        }
      : {
          0: { cellWidth: 8 },
          1: { cellWidth: 35, halign: 'left' },
          2: { cellWidth: 18 },
          3: { cellWidth: 12 },
          4: { cellWidth: 16 },
          5: { cellWidth: 18 },
          6: { cellWidth: 14 },
          7: { cellWidth: 18 },
          8: { cellWidth: 10 },
          9: { cellWidth: 16 },
          10: { cellWidth: 19 },
        },
    showFoot: 'lastPage',
    margin: { left: ml, right: mr }
  })

  let finalY = doc.lastAutoTable.finalY

  // ─── 6. SUMMARY (Words + Totals side by side) ─────────────────────────────
  const smH = isIntra ? 30 : 26
  box(ml, finalY, cw, smH, 0.3)
  vline(mid, finalY, finalY + smH, 0.2)

  // Words block (left)
  setN(); doc.setFontSize(7)
  doc.text('Total Invoice Value (In Words)', lp, finalY + 5)
  setB(); doc.setFontSize(8.5)
  const words = (invoice.totalWords || '').toUpperCase()
  const wordLines = doc.splitTextToSize(words, (cw / 2) - 6)
  doc.text(wordLines, lp, finalY + 10)

  // Summary rows (right)
  doc.setFontSize(8)
  let sy = finalY + 5
  const sumW = (cw / 2) - 4

  const addRow = (label: string, val: string, bold = false) => {
    bold ? setB() : setN()
    doc.text(label, mid + 2, sy)
    doc.text(val, mid + sumW, sy, { align: 'right' })
    sy += 4
  }

  addRow('Total Taxable Amount', fmtN(invoice.taxableAmount))
  if (isIntra) {
    addRow('Add: CGST', fmtN(invoice.cgstTotal))
    addRow('Add: SGST', fmtN(invoice.sgstTotal))
    addRow('Total Tax Amount', fmtN(invoice.totalTax))
    addRow('Amount After Tax', fmtN(invoice.amountAfterTax))
    addRow('Round Off', fmtN(invoice.roundOff))
  } else {
    addRow('Add: IGST', fmtN(invoice.igstTotal))
    addRow('Total Tax Amount', fmtN(invoice.totalTax))
    addRow('Round Off', fmtN(invoice.roundOff))
  }
  hline(sy - 1, mid, mid + sumW, 0.3)
  addRow('Total Invoice Value', fmtN(invoice.totalValue), true)

  finalY += smH

  // ─── 7. DECLARATION ────────────────────────────────────────────────────────
  const decText = invoice.declarationText || ''
  doc.setFontSize(7); setN()
  const decLines = doc.splitTextToSize(decText, cw - 6)
  const decH = Math.max(decLines.length * 3 + 6, 18)
  box(ml, finalY, cw, decH, 0.3)
  doc.text(decLines, lp, finalY + 4)
  finalY += decH

  // ─── 8. SIGNATURE BLOCK ────────────────────────────────────────────────────
  const sigH = 22
  box(ml, finalY, cw, sigH, 0.3)
  vline(mid, finalY, finalY + sigH, 0.2)

  setB(); doc.setFontSize(8)
  doc.text("RECEIVER'S SIGNATURE", lp, finalY + 4)

  doc.text('FOR, SHAKTI EXPORTS', mid + sumW, finalY + 4, { align: 'right' })
  doc.setFont('times', 'italic'); doc.setFontSize(14)
  doc.text('T.V. Shah', mid + sumW, finalY + 14, { align: 'right' })
  setB(); doc.setFontSize(8)
  doc.text('PROPRIETOR', mid + sumW, finalY + 20, { align: 'right' })

  finalY += sigH

  // ─── 9. FOOTER ─────────────────────────────────────────────────────────────
  setN(); doc.setFontSize(7.5); doc.setTextColor(40)
  doc.text('B/503, Rajratna Enclave, B/h. Sanskruti Township, Opp. Pal RTO, Pal, Surat-395009.', pw / 2, finalY + 5, { align: 'center' })
  doc.text('E-mail: info@shaktiexports.in  |  Mobile: +91 98986 18197  |  Website: WWW.SHAKTIEXPORTS.IN', pw / 2, finalY + 9, { align: 'center' })

  return doc
}
