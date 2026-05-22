export const dynamic = 'force-dynamic'

import { InvoiceForm } from '@/components/InvoiceForm'
import { prisma } from '@/lib/prisma'
import { getInvoice } from '@/lib/actions/invoices'
import { getProfile } from '@/lib/actions/profile'
import { notFound } from 'next/navigation'

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const id = parseInt(idStr)
  if (isNaN(id)) notFound()

  const invoice = await getInvoice(id)
  if (!invoice) notFound()

  const parties = await prisma.party.findMany({
    orderBy: { name: 'asc' }
  })
  
  const declarations = await prisma.declaration.findMany({
    orderBy: { title: 'asc' }
  })

  const profile = await getProfile()

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <h1>Edit Invoice #{invoice.invoiceNo}</h1>
        <p className="subtitle">Update invoice details and recalculate totals</p>
      </header>
      
      <InvoiceForm parties={parties} declarations={declarations} initialProfile={profile} initialData={invoice} />
    </div>
  )
}
