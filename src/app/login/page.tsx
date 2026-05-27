import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '85vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <LoginForm />
    </div>
  )
}
