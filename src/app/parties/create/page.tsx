import { PartyForm } from '@/components/PartyForm'

export default function CreatePartyPage() {
  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <h1>Add New Party</h1>
        <p className="subtitle">Enter details for the billed-to party</p>
      </header>
      
      <div className="glass-card">
        <PartyForm />
      </div>

    </div>
  )
}
