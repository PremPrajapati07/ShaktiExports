import { PurchasePartyForm } from '@/components/PurchasePartyForm'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { updateSupplier } from '@/lib/actions/purchase-parties'

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supplier = await prisma.purchaseSupplier.findUnique({ where: { id: parseInt(id) } })
  if (!supplier) notFound()

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div className="header-content">
          <h1>Edit Supplier</h1>
          <p className="subtitle">{supplier.name}</p>
        </div>
      </header>
      <PurchasePartyForm
        initialData={supplier}
        action={(data) => updateSupplier(supplier.id, data)}
        redirectTo="/purchase-suppliers"
        label="Supplier"
        role="supplier"
      />
    </div>
  )
}

