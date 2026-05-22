export const dynamic = 'force-dynamic'

import { getProfile } from '@/lib/actions/profile'
import { ProfileForm } from '@/components/ProfileForm'

export default async function ProfilePage() {
  const profile = await getProfile()

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div className="header-content">
          <h1>Company Profile</h1>
          <p className="subtitle">Manage invoice header defaults and bank details</p>
        </div>
      </header>
      <ProfileForm initialProfile={profile} />
    </div>
  )
}
