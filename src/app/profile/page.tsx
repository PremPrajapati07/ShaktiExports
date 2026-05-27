export const dynamic = 'force-dynamic'

import { getProfile } from '@/lib/actions/profile'
import { ProfileForm } from '@/components/ProfileForm'
import { getAuthSession } from '@/lib/auth'

export default async function ProfilePage() {
  const profile = await getProfile()
  const user = await getAuthSession()

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div className="header-content">
          <h1>Company Profile</h1>
          <p className="subtitle">Manage invoice header defaults and bank details</p>
        </div>
      </header>
      <ProfileForm initialProfile={profile} user={user} />
    </div>
  )
}

