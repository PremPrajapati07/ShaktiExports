import { PurchasePartyForm } from '@/components/PurchasePartyForm'
import { createSupplier } from '@/lib/actions/purchase-parties'

export default function CreateSupplierPage() {
  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div className="header-content">
          <h1>Add New Supplier</h1>
          <p className="subtitle">Add a company/person you purchase from</p>
        </div>
      </header>
      <PurchasePartyForm redirectTo="/purchase-suppliers" label="Supplier" role="supplier" />
    </div>
  )
}

