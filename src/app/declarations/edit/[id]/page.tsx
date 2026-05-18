import { DeclarationForm } from '@/components/DeclarationForm'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export default async function EditDeclarationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dec = await prisma.declaration.findUnique({
    where: { id: parseInt(id) }
  })

  if (!dec) {
    notFound()
  }

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <h1>Edit Declaration Template</h1>
        <p className="subtitle">Update template: {dec.title}</p>
      </header>
      
      <div className="glass-card">
        <DeclarationForm declaration={dec} />
      </div>

    </div>
  )
}
