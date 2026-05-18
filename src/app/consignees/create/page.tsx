import { PartyForm } from '@/components/PartyForm'

export default function CreateConsigneePage() {
  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <h1>Add New Consignee</h1>
        <p className="subtitle">Enter details for the shipping destination</p>
      </header>
      
      <div className="glass-card">
        <PartyForm type="Consignee" />
      </div>

    </div>
  )
}
