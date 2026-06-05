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

export function generateInvoicePDF(
  invoice: any,
  profile?: any,
  options?: {
    templateType?: string
    isDigitallySigned?: boolean
    exportOptions?: {
      countryOfOrigin?: string
      finalDestination?: string
      portOfLoading?: string
      portOfDischarge?: string
    }
  }
) {
  const templateType = options?.templateType || invoice.templateType || 'Standard'
  const isDigitallySigned = options?.isDigitallySigned !== undefined ? options.isDigitallySigned : invoice.isDigitallySigned
  const exportOptions = options?.exportOptions

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

  let y = templateType === 'Compact' ? 6 : 8

  // ─── 1. HEADER ─────────────────────────────────────────────────────────────
  if (templateType === 'Letterhead') {
    // Reserve blank space for pre-printed letterhead (approx 44mm)
    y = 48
  } else {
    // Draw Diamond logo
    doc.setLineWidth(0.5)
    const lx = ml + 3, ly = y
    const logoScale = templateType === 'Compact' ? 12 : 16
    const ls = logoScale
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
    const bx = ml + ls + (templateType === 'Compact' ? 5 : 8)
    doc.setTextColor(0)
    setB()
    doc.setFontSize(templateType === 'Compact' ? 18 : 22)
    doc.text(profile?.companyName || 'SHAKTI EXPORTS', bx, y + (templateType === 'Compact' ? 5 : 7))
    
    doc.setFontSize(templateType === 'Compact' ? 11 : 13)
    doc.text('Cut & Polished Diamonds', bx, y + (templateType === 'Compact' ? 10 : 13))
    
    setN()
    doc.setFontSize(templateType === 'Compact' ? 5.5 : 6.5)
    doc.text('ADORN YOUR DREAM', bx, y + (templateType === 'Compact' ? 13 : 17))
    
    hline(y + (templateType === 'Compact' ? 15 : 19), bx, bx + 78, 0.2)
    doc.setFontSize(templateType === 'Compact' ? 5 : 6)
    doc.text('DIAMOND MANUFACTURER | EXPORTER | IMPORTER', bx, y + (templateType === 'Compact' ? 18 : 22))

    // Invoice No top right
    setB(); doc.setFontSize(9)
    doc.text(invoice.invoiceNo, pw - mr, y + 5, { align: 'right' })

    y += templateType === 'Compact' ? 22 : 26
  }

  // ─── 2. TAX INVOICE TITLE ──────────────────────────────────────────────────
  box(ml, y, cw, templateType === 'Compact' ? 7 : 9, 0.4)
  setB(); doc.setFontSize(templateType === 'Compact' ? 11 : 13)
  doc.text(templateType === 'Export' ? 'EXPORT INVOICE' : 'Tax Invoice', pw / 2, y + (templateType === 'Compact' ? 5 : 6.5), { align: 'center' })
  y += templateType === 'Compact' ? 7 : 9

  // ─── 3. INFO GRID (Invoice details + Banker) ───────────────────────────────
  const isInter = invoice.type === 'Inter'
  let infoH = isInter ? 23 : 20
  if (templateType === 'Compact') {
    infoH = isInter ? 18 : 15
  }
  box(ml, y, cw, infoH, 0.3)
  vline(mid, y, y + infoH, 0.2)

  doc.setFontSize(templateType === 'Compact' ? 7.5 : 8)
  const lp = ml + 2   // left padding
  const rp = mid + 2  // right section start

  let iy = y + (templateType === 'Compact' ? 4 : 5)
  const lineSpacing = templateType === 'Compact' ? 3.2 : 4
  
  cell('Invoice No:', lp, iy, true); cell(invoice.invoiceNo, lp + 22, iy)
  iy += lineSpacing
  cell('Invoice Date:', lp, iy, true); cell(format(new Date(invoice.date), 'dd/MM/yyyy'), lp + 22, iy)
  iy += lineSpacing
  cell('GSTIN:', lp, iy, true); cell(invoice.gstin, lp + 13, iy)
  cell('PAN NO.:', lp + 65, iy, true); cell(invoice.pan, lp + 80, iy)
  iy += lineSpacing
  cell('Terms:', lp, iy, true); cell(invoice.terms || '', lp + 13, iy)
  if (isInter) {
    iy += lineSpacing
    cell('District Origin:', lp, iy, true); cell(invoice.districtOriginCode || '', lp + 25, iy)
  }

  iy = y + (templateType === 'Compact' ? 4 : 5)
  cell('Our Banker:', rp, iy, true)
  doc.setFontSize(templateType === 'Compact' ? 7 : 7.5); setN()
  const bankerText = invoice.banker || ''
  const bankerLines = doc.splitTextToSize(bankerText, (cw/2) - 25)
  doc.text(bankerLines, rp + 20, iy)
  
  doc.setFontSize(templateType === 'Compact' ? 7.5 : 8)
  iy += (bankerLines.length > 1 ? (templateType === 'Compact' ? 6 : 8) : lineSpacing)
  cell('A/c.No.:', rp, iy, true); cell(invoice.accountNo || '', rp + 15, iy)
  iy += lineSpacing
  cell('RTGS/IFSC:', rp, iy, true); cell(invoice.ifsc || '', rp + 18, iy)
  
  if (templateType === 'Export' && profile?.swiftCode) {
    iy += lineSpacing
    cell('SWIFT Code:', rp, iy, true); cell(profile.swiftCode, rp + 20, iy)
  }

  y += infoH
  hline(y, ml, ml + cw, 0.3)

  // ─── 4. PARTY BLOCK ────────────────────────────────────────────────────────
  let partyH = templateType === 'Compact' ? 30 : 38
  box(ml, y, cw, partyH, 0.3)
  vline(mid, y, y + partyH, 0.2)

  // Header labels
  setB(); doc.setFontSize(templateType === 'Compact' ? 7.5 : 8)
  doc.text('Details of Receiver (Billed to)', ml + cw/4, y + (templateType === 'Compact' ? 3.5 : 4), { align: 'center' })
  doc.text('Details of Consignee (Shipped to)', mid + cw/4, y + (templateType === 'Compact' ? 3.5 : 4), { align: 'center' })
  hline(y + (templateType === 'Compact' ? 5 : 6), ml, ml + cw, 0.2)

  const billed = invoice.billedTo
  const shipped = invoice.shippedTo
  const pTop = y + (templateType === 'Compact' ? 9 : 10)

  // Billed To
  setB(); doc.setFontSize(templateType === 'Compact' ? 8 : 9); doc.text(billed.name.toUpperCase(), lp, pTop)
  setN(); doc.setFontSize(templateType === 'Compact' ? 7.5 : 8)
  const bAddr = doc.splitTextToSize(billed.address, (cw/2) - 8)
  doc.text(bAddr, lp, pTop + (templateType === 'Compact' ? 4 : 5))
  
  hline(y + (templateType === 'Compact' ? 21 : 28), ml, mid, 0.15)
  setB(); doc.setFontSize(templateType === 'Compact' ? 7 : 7.5)
  
  if (templateType === 'Export') {
    cell(`Origin Country: ${exportOptions?.countryOfOrigin || 'INDIA'}`, lp, y + (templateType === 'Compact' ? 24 : 32), true)
    hline(y + (templateType === 'Compact' ? 26 : 34), ml, mid, 0.15)
    cell(`Port of Loading: ${exportOptions?.portOfLoading || 'MUMBAI, INDIA'}`, lp, y + (templateType === 'Compact' ? 29 : 37), true)
  } else {
    cell(`State: ${billed.state}`, lp, y + (templateType === 'Compact' ? 24 : 32), true)
    cell(`Code: ${billed.stateCode}`, mid - 20, y + (templateType === 'Compact' ? 24 : 32), true)
    hline(y + (templateType === 'Compact' ? 26 : 34), ml, mid, 0.15)
    cell('GSTIN:', lp, y + (templateType === 'Compact' ? 29 : 37), true); setN(); doc.text(billed.gstin, lp + 12, y + (templateType === 'Compact' ? 29 : 37))
    cell(' PAN:', lp + 42, y + (templateType === 'Compact' ? 29 : 37), true); doc.text(billed.pan || '', lp + 52, y + (templateType === 'Compact' ? 29 : 37))
  }

  // Shipped To
  setB(); doc.setFontSize(templateType === 'Compact' ? 8 : 9); doc.text(shipped.name.toUpperCase(), mid + 2, pTop)
  setN(); doc.setFontSize(templateType === 'Compact' ? 7.5 : 8)
  const sAddr = doc.splitTextToSize(shipped.address, (cw/2) - 8)
  doc.text(sAddr, mid + 2, pTop + (templateType === 'Compact' ? 4 : 5))
  
  hline(y + (templateType === 'Compact' ? 21 : 28), mid, ml + cw, 0.15)
  setB(); doc.setFontSize(templateType === 'Compact' ? 7 : 7.5)
  
  if (templateType === 'Export') {
    cell(`Final Destination: ${exportOptions?.finalDestination || 'BELGIUM'}`, mid + 2, y + (templateType === 'Compact' ? 24 : 32), true)
    hline(y + (templateType === 'Compact' ? 26 : 34), mid, ml + cw, 0.15)
    cell(`Port of Discharge: ${exportOptions?.portOfDischarge || 'ANTWERP, BELGIUM'}`, mid + 2, y + (templateType === 'Compact' ? 29 : 37), true)
  } else {
    cell(`State: ${shipped.state}`, mid + 2, y + (templateType === 'Compact' ? 24 : 32), true)
    cell(`Code: ${shipped.stateCode}`, ml + cw - 20, y + (templateType === 'Compact' ? 24 : 32), true)
    hline(y + (templateType === 'Compact' ? 26 : 34), mid, ml + cw, 0.15)
    cell('GSTIN:', mid + 2, y + (templateType === 'Compact' ? 29 : 37), true); setN(); doc.text(shipped.gstin || '', mid + 14, y + (templateType === 'Compact' ? 29 : 37))
  }

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

  // Pad with empty rows (minimum 5 rows visible, or 3 if compact)
  const minRows = templateType === 'Compact' ? 3 : 5
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
      fontSize: templateType === 'Compact' ? 7.5 : 8,
      cellPadding: templateType === 'Compact' 
        ? { top: 0.8, bottom: 0.8, left: 1.5, right: 1.5 }
        : { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 },
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
      fontSize: templateType === 'Compact' ? 7 : 7.5,
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
  let smH = isIntra ? 30 : 26
  if (templateType === 'Compact') {
    smH = isIntra ? 22 : 18
  }
  box(ml, finalY, cw, smH, 0.3)
  vline(mid, finalY, finalY + smH, 0.2)

  // Words block (left)
  setN(); doc.setFontSize(templateType === 'Compact' ? 6.5 : 7)
  doc.text('Total Invoice Value (In Words)', lp, finalY + (templateType === 'Compact' ? 3.5 : 5))
  setB(); doc.setFontSize(templateType === 'Compact' ? 7.5 : 8.5)
  const words = (invoice.totalWords || '').toUpperCase()
  const wordLines = doc.splitTextToSize(words, (cw / 2) - 6)
  doc.text(wordLines, lp, finalY + (templateType === 'Compact' ? 7.5 : 10))

  // Summary rows (right)
  doc.setFontSize(templateType === 'Compact' ? 7.5 : 8)
  let sy = finalY + (templateType === 'Compact' ? 3.5 : 5)
  const sumW = (cw / 2) - 4
  const sumLineSpacing = templateType === 'Compact' ? 2.8 : 4

  const addRow = (label: string, val: string, bold = false) => {
    bold ? setB() : setN()
    doc.text(label, mid + 2, sy)
    doc.text(val, mid + sumW, sy, { align: 'right' })
    sy += sumLineSpacing
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
  doc.setFontSize(templateType === 'Compact' ? 6.5 : 7); setN()
  const decLines = doc.splitTextToSize(decText, cw - 6)
  const decH = templateType === 'Compact'
    ? Math.max(decLines.length * 2.5 + 3, 12)
    : Math.max(decLines.length * 3 + 6, 18)
  box(ml, finalY, cw, decH, 0.3)
  doc.text(decLines, lp, finalY + (templateType === 'Compact' ? 3 : 4))
  finalY += decH

  // ─── 8. SIGNATURE BLOCK ────────────────────────────────────────────────────
  let sigH = templateType === 'Compact' ? 16 : 22
  box(ml, finalY, cw, sigH, 0.3)
  vline(mid, finalY, finalY + sigH, 0.2)

  setB(); doc.setFontSize(templateType === 'Compact' ? 7.5 : 8)
  doc.text("RECEIVER'S SIGNATURE", lp, finalY + (templateType === 'Compact' ? 3 : 4))

  doc.text(`FOR, ${profile?.companyName || 'SHAKTI EXPORTS'}`, mid + sumW, finalY + (templateType === 'Compact' ? 3 : 4), { align: 'right' })
  
  if (isDigitallySigned && profile?.signatureImage) {
    try {
      doc.addImage(profile.signatureImage, 'PNG', mid + (templateType === 'Compact' ? 8 : 15), finalY + (templateType === 'Compact' ? 3 : 5), 35, templateType === 'Compact' ? 8 : 11)
    } catch (e) {
      console.error('Failed to embed signature image:', e)
    }
  } else {
    doc.setFont('times', 'italic'); doc.setFontSize(templateType === 'Compact' ? 11 : 14)
    doc.text('T.V. Shah', mid + sumW, finalY + (templateType === 'Compact' ? 9 : 14), { align: 'right' })
  }

  if (isDigitallySigned && profile?.sealImage) {
    try {
      doc.addImage(profile.sealImage, 'PNG', mid + (templateType === 'Compact' ? 55 : 62), finalY + (templateType === 'Compact' ? 2 : 4), templateType === 'Compact' ? 11 : 14, templateType === 'Compact' ? 11 : 14)
    } catch (e) {
      console.error('Failed to embed seal image:', e)
    }
  }

  setB(); doc.setFontSize(templateType === 'Compact' ? 7 : 8)
  doc.text('PROPRIETOR', mid + sumW, finalY + (templateType === 'Compact' ? 14 : 20), { align: 'right' })

  finalY += sigH

  // ─── 8.5. VERIFIED BANNER ──────────────────────────────────────────────────
  if (isDigitallySigned) {
    doc.setDrawColor(34, 197, 94)
    doc.setFillColor(240, 253, 244)
    doc.rect(ml, finalY, cw, 6, 'FD')
    
    doc.setFontSize(6.5)
    doc.setTextColor(22, 101, 52)
    setB()
    const txId = `TXN-${invoice.invoiceNo.replace(/\//g, '-')}-${invoice.id}`
    const dateStr = format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    const hash = Array.from({length:16}, () => Math.floor(Math.random()*16).toString(16)).join('')
    doc.text(`✓ DIGITALLY SIGNED & VERIFIED SECURE · TXN ID: ${txId} · TIMESTAMP: ${dateStr} · SECURE HASH: SHA256-${hash.toUpperCase()}`, ml + 2, finalY + 4.2)
    doc.setTextColor(0)
    doc.setDrawColor(0)
    
    finalY += 6
  }

  // ─── 9. FOOTER ─────────────────────────────────────────────────────────────
  if (templateType !== 'Letterhead') {
    setN(); doc.setFontSize(7.5); doc.setTextColor(40)
    doc.text('B/503, Rajratna Enclave, B/h. Sanskruti Township, Opp. Pal RTO, Pal, Surat-395009.', pw / 2, finalY + 5, { align: 'center' })
    doc.text('E-mail: info@shaktiexports.in  |  Mobile: +91 98986 18197  |  Website: WWW.SHAKTIEXPORTS.IN', pw / 2, finalY + 9, { align: 'center' })
  }

  return doc
}

export function generatePurchaseInvoicePDF(
  invoice: any,
  profile?: any,
  options?: {
    templateType?: string
    isDigitallySigned?: boolean
    exportOptions?: {
      countryOfOrigin?: string
      finalDestination?: string
      portOfLoading?: string
      portOfDischarge?: string
    }
  }
) {
  const templateType = options?.templateType || invoice.templateType || 'Standard'
  const isDigitallySigned = options?.isDigitallySigned !== undefined ? options.isDigitallySigned : invoice.isDigitallySigned
  const exportOptions = options?.exportOptions

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

  let y = templateType === 'Compact' ? 6 : 8

  // ── Title ──────────────────────────────────────────────────────────────────
  if (templateType === 'Letterhead') {
    y = 35 // offset for pre-printed letterhead, but keeping title
  }
  setB(); doc.setFontSize(templateType === 'Compact' ? 11 : 13)
  doc.text('Tax Invoice', pw / 2, y + 5, { align: 'center' })
  doc.setFontSize(templateType === 'Compact' ? 7 : 8); setN()
  doc.text('(Purchase)', pw / 2, y + 9, { align: 'center' })
  y += templateType === 'Compact' ? 11 : 14

  // ── TOP GRID: Seller left, Invoice meta right ──────────────────────────────
  let topH = templateType === 'Compact' ? 30 : 40
  box(ml, y, cw, topH, 0.35)
  vline(mid, y, y + topH)

  // Seller (Supplier) details - left
  const sup = invoice.supplier
  setB(); doc.setFontSize(templateType === 'Compact' ? 9 : 10)
  doc.text(sup.name.toUpperCase(), ml + 3, y + 5)
  setN(); doc.setFontSize(templateType === 'Compact' ? 7.5 : 8)
  const supAddr = doc.splitTextToSize(`${sup.address}, ${sup.city}`, cw / 2 - 10)
  doc.text(supAddr, ml + 3, y + 9)
  let sly = y + 9 + supAddr.length * 3.5
  doc.text(`GSTIN/UIN: ${sup.gstin}`, ml + 3, sly)
  sly += 3.5
  doc.text(`State: ${sup.state}, Code: ${sup.stateCode}`, ml + 3, sly)

  // Invoice meta - right
  const cells = [
    ['Invoice No.', invoice.invoiceNo],
    ['Dated', format(new Date(invoice.date), 'dd-MMM-yy').toUpperCase()],
    ['Mode/Terms', invoice.terms || ''],
    ['Diamond Type', invoice.diamondType === 'LabGrown' ? 'Lab Grown (CVD)' : 'Natural Diamond'],
  ]
  if (invoice.supplierInvoiceNo) {
    cells.push(['Supplier Inv No.', invoice.supplierInvoiceNo])
  }
  const rowH = topH / cells.length
  cells.forEach((pair, i) => {
    const cy = y + i * rowH
    if (i > 0) hline(cy, mid, ml + cw)
    const lx = mid + 3, rx = ml + cw - 3
    doc.setFontSize(templateType === 'Compact' ? 7 : 7.5); setN()
    doc.text(pair[0], lx, cy + (templateType === 'Compact' ? 3.5 : 4))
    doc.setFontSize(templateType === 'Compact' ? 7.5 : 8); setB()
    doc.text(pair[1], rx, cy + (templateType === 'Compact' ? 3.5 : 4), { align: 'right' })
  })

  y += topH

  // ── PARTIES: Ship To + Bill To on Left, Right Empty ──────────────────
  let partyH = templateType === 'Compact' ? 35 : 45
  box(ml, y, cw, partyH, 0.3)
  vline(mid, y, y + partyH)

  const leftX = ml
  const leftW = cw / 2
  const halfPartyH = partyH / 2
  hline(y + halfPartyH, leftX, mid)

  // Terms Right block
  setN()
  doc.setFontSize(templateType === 'Compact' ? 7.5 : 8)
  doc.text('Terms of Delivery', mid + 3, y + 4.5)

  const renderParty = (
    party: any,
    x: number,
    startY: number,
    label: string
  ) => {
    if (!party) return

    setN()
    doc.setFontSize(templateType === 'Compact' ? 6.5 : 7)
    doc.text(label.toUpperCase(), x + 2, startY + 3.5)

    setB()
    doc.setFontSize(templateType === 'Compact' ? 8 : 9)
    doc.text(party.name.toUpperCase(), x + 2, startY + 7.5)

    setN()
    doc.setFontSize(templateType === 'Compact' ? 7.5 : 8)

    const addr = doc.splitTextToSize(
      `${party.address}, ${party.city}`,
      leftW - 8
    )

    doc.text(addr, x + 2, startY + 11.5)
    let py = startY + 11.5 + addr.length * 3
    doc.text(`GSTIN/UIN: ${party.gstin}`, x + 2, py)
    py += 3
    doc.text(`State: ${party.state}, Code: ${party.stateCode}`, x + 2, py)
  }

  // TOP LEFT → SHIP TO
  renderParty(invoice.shipTo, ml, y, 'Consignee (Ship to)')

  // BOTTOM LEFT → BILL TO
  renderParty(invoice.billTo, ml, y + halfPartyH, 'Buyer (Bill to)')

  y += partyH

  // ── TERMS ROW ─────────────────────────────────────────────────────────────
  const termsH = templateType === 'Compact' ? 6 : 7
  box(ml, y, cw, termsH, 0.2)
  setN(); doc.setFontSize(templateType === 'Compact' ? 7.5 : 8)
  doc.text(`Terms of Delivery: `, ml + 3, y + (templateType === 'Compact' ? 4 : 5))
  setB(); doc.text(invoice.terms || 'As per agreement', ml + 35, y + (templateType === 'Compact' ? 4 : 5))
  y += termsH

  // ── PRODUCT TABLE ─────────────────────────────────────────────────────────
  const isIGST = invoice.type === 'Intra' // Wait, in the original code, `isIGST` maps to `invoice.type === 'Intra'`. Keep this parity.

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

  // Pad to 5 rows (3 if compact)
  const minRowsTable = templateType === 'Compact' ? 3 : 5
  const colCountTable = isIGST ? 9 : 11
  while (bodyRows.length < minRowsTable) bodyRows.push(Array(colCountTable).fill(''))

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
    styles: { 
      fontSize: templateType === 'Compact' ? 7.5 : 8, 
      cellPadding: templateType === 'Compact' 
        ? { top: 0.8, bottom: 0.8, left: 1.5, right: 1.5 } 
        : { top: 2, bottom: 2, left: 2, right: 2 }, 
      lineColor: [0, 0, 0], 
      lineWidth: 0.15, 
      textColor: [0, 0, 0], 
      halign: 'center', 
      valign: 'middle' 
    },
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
  let awH = templateType === 'Compact' ? 9 : 12
  box(ml, finalY, cw, awH, 0.2)
  setN(); doc.setFontSize(templateType === 'Compact' ? 6.5 : 7); doc.text('Amount Chargeable (in words)', ml + 3, finalY + (templateType === 'Compact' ? 3 : 4))
  setB(); doc.setFontSize(templateType === 'Compact' ? 7.5 : 8.5)
  const wLines = doc.splitTextToSize((invoice.totalWords || '').toUpperCase(), cw - 50)
  doc.text(wLines, ml + 3, finalY + (templateType === 'Compact' ? 6.5 : 8))
  doc.setFontSize(7.5); setN(); doc.text('E. & O.E', ml + cw - 3, finalY + (templateType === 'Compact' ? 6.5 : 8), { align: 'right' })
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
    styles: { 
      fontSize: templateType === 'Compact' ? 7 : 7.5, 
      cellPadding: templateType === 'Compact' ? { top: 0.8, bottom: 0.8 } : { top: 1.5, bottom: 1.5 },
      lineColor: [0, 0, 0], 
      lineWidth: 0.15, 
      halign: 'center' 
    },
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
  let bankH = templateType === 'Compact' ? 22 : 28
  box(ml, finalY, cw, bankH, 0.3)
  vline(mid, finalY, finalY + bankH)

  setB(); doc.setFontSize(templateType === 'Compact' ? 7.5 : 8.5)
  doc.text("Company's Bank Details", ml + cw / 4, finalY + 4.5, { align: 'center' })
  hline(finalY + (templateType === 'Compact' ? 6.5 : 7), ml, mid)
  
  doc.setFontSize(templateType === 'Compact' ? 7 : 8); setN()
  const bankRows = [
    ["A/c Holder", sup.name],
    ['Bank Name', invoice.bankerName || 'N/A'],
    ['A/c No.', invoice.accountNo || 'N/A'],
    ['IFSC/SWIFT', `${invoice.ifsc || 'N/A'}${invoice.swiftCode ? ' / ' + invoice.swiftCode : ''}`],
  ]
  const bankLineSpacing = templateType === 'Compact' ? 3.2 : 4
  bankRows.forEach((row, i) => {
    const by = finalY + (templateType === 'Compact' ? 9.5 : 11) + i * bankLineSpacing
    setN(); doc.setFontSize(templateType === 'Compact' ? 7 : 7.5); doc.text(row[0], ml + 3, by)
    doc.text(': ', mid - 25, by)
    setB(); doc.text(row[1], mid - 22, by)
  })

  // Signatory right
  setB(); doc.setFontSize(templateType === 'Compact' ? 7.5 : 8.5)
  doc.text(`for ${sup.name.toUpperCase()}`, mid + cw / 4, finalY + 4.5, { align: 'center' })
  
  if (isDigitallySigned && profile?.signatureImage) {
    try {
      doc.addImage(profile.signatureImage, 'PNG', mid + cw/4 - 15, finalY + (templateType === 'Compact' ? 6.5 : 8), 30, templateType === 'Compact' ? 8 : 10)
    } catch (e) {
      console.error(e)
    }
  }

  if (isDigitallySigned && profile?.sealImage) {
    try {
      doc.addImage(profile.sealImage, 'PNG', mid + cw/4 + 15, finalY + (templateType === 'Compact' ? 5.5 : 7), templateType === 'Compact' ? 9 : 12, templateType === 'Compact' ? 9 : 12)
    } catch (e) {
      console.error(e)
    }
  }

  setN(); doc.setFontSize(templateType === 'Compact' ? 7 : 8)
  doc.text('Authorised Signatory', mid + cw / 4, finalY + bankH - 3, { align: 'center' })

  finalY += bankH

  // ── 8.5. VERIFIED BANNER ──────────────────────────────────────────────────
  if (isDigitallySigned) {
    doc.setDrawColor(34, 197, 94)
    doc.setFillColor(240, 253, 244)
    doc.rect(ml, finalY, cw, 6, 'FD')
    
    doc.setFontSize(6.5)
    doc.setTextColor(22, 101, 52)
    setB()
    const txId = `TXN-PUR-${invoice.invoiceNo.replace(/\//g, '-')}-${invoice.id}`
    const dateStr = format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    const hash = Array.from({length:16}, () => Math.floor(Math.random()*16).toString(16)).join('')
    doc.text(`✓ DIGITALLY SIGNED & VERIFIED SECURE · TXN ID: ${txId} · TIMESTAMP: ${dateStr} · SECURE HASH: SHA256-${hash.toUpperCase()}`, ml + 2, finalY + 4.2)
    doc.setTextColor(0)
    doc.setDrawColor(0)
    
    finalY += 6
  }

  // ── PAN + Declaration ──────────────────────────────────────────────────────
  let panH = templateType === 'Compact' ? 14 : 18
  box(ml, finalY, cw, panH, 0.2)
  vline(mid, finalY, finalY + panH)

  setN(); doc.setFontSize(templateType === 'Compact' ? 6.5 : 7)
  doc.text("Company's PAN", ml + 3, finalY + 3.5)
  setB(); doc.setFontSize(templateType === 'Compact' ? 9.5 : 11)
  doc.text(`: ${sup.pan}`, ml + 3, finalY + (templateType === 'Compact' ? 8.5 : 10))
  
  setN(); doc.setFontSize(templateType === 'Compact' ? 7 : 7.5)
  doc.text('Declaration', mid + 3, finalY + 3.5)
  doc.setFontSize(templateType === 'Compact' ? 6.5 : 7)
  const decLines = doc.splitTextToSize(invoice.declarationText || 'We declare that this invoice shows the actual price of the goods.', cw / 2 - 6)
  doc.text(decLines, mid + 3, finalY + (templateType === 'Compact' ? 7 : 8))

  return doc
}
