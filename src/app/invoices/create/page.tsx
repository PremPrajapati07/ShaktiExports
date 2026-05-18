import { InvoiceForm } from '@/components/InvoiceForm'
import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export default async function CreateInvoicePage() {
  const parties = await prisma.party.findMany({
    orderBy: { name: 'asc' }
  })
  
  const declarations = await prisma.declaration.findMany({
    orderBy: { title: 'asc' }
  })

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <h1>Create New Invoice</h1>
        <p className="subtitle">Follow the steps to generate a GST compliant invoice</p>
      </header>
      
      <InvoiceForm parties={parties} declarations={declarations} />

    </div>
  )
}
