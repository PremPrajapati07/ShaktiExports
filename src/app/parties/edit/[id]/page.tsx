import { PartyForm } from '@/components/PartyForm'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export default async function EditPartyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const party = await prisma.party.findUnique({
    where: { id: parseInt(id) }
  })

  if (!party) {
    notFound()
  }

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <h1>Edit Party</h1>
        <p className="subtitle">Update details for {party.name}</p>
      </header>
      
      <div className="glass-card">
        <PartyForm party={party} />
      </div>

    </div>
  )
}
