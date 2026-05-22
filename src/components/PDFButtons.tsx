'use client'

import { Download } from 'lucide-react'
import { generateInvoicePDF } from '@/lib/pdf-generator'

export function PDFDownloadButton({ invoice }: { invoice: any }) {
  const handleDownload = () => {
    const doc = generateInvoicePDF(invoice)
    doc.save(`${invoice.invoiceNo.replace(/\//g, '_')}.pdf`)
  }

  return (
    <button onClick={handleDownload} className="btn btn-primary">
      <Download size={20} />
      <span>Download PDF</span>
    </button>
  )
}

