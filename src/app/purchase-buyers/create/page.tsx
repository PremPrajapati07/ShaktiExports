import { PurchasePartyForm } from '@/components/PurchasePartyForm'
import { createPurchaseBuyer } from '@/lib/actions/purchase-parties'

export default function CreateBuyerPage() {
  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div className="header-content">
          <h1>Add New Buyer / Consignee</h1>
          <p className="subtitle">Add the entity that purchases or receives the diamonds</p>
        </div>
      </header>
      <PurchasePartyForm action={createPurchaseBuyer} redirectTo="/purchase-buyers" label="Buyer" role="buyer" />
    </div>
  )
}

