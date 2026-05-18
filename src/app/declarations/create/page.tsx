import { DeclarationForm } from '@/components/DeclarationForm'

export default function CreateDeclarationPage() {
  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <h1>New Declaration Template</h1>
        <p className="subtitle">Create a reusable text template for invoices</p>
      </header>
      
      <div className="glass-card">
        <DeclarationForm />
      </div>

    </div>
  )
}
