import { PurchasePartyForm } from '@/components/PurchasePartyForm'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { updatePurchaseBuyer } from '@/lib/actions/purchase-parties'

export default async function EditBuyerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const buyer = await prisma.purchaseBuyer.findUnique({ where: { id: parseInt(id) } })
  if (!buyer) notFound()

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div className="header-content">
          <h1>Edit Buyer</h1>
          <p className="subtitle">{buyer.name}</p>
        </div>
      </header>
      <PurchasePartyForm
        initialData={buyer}
        redirectTo="/purchase-buyers"
        label="Buyer"
        role="buyer"
      />
    </div>
  )
}

