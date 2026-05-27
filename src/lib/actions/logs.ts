'use server'

import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/auth'

export async function createAuditLog(action: string, entityType: string, entityId: string | null, details: string) {
  try {
    const user = await getAuthSession()
    if (!user) return null

    return await prisma.auditLog.create({
      data: {
        username: user.username,
        role: user.role,
        action,
        entityType,
        entityId: entityId?.toString() || null,
        details
      }
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    return null
  }
}

export async function getAuditLogs() {
  const user = await getAuthSession()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators can view audit logs.')
  }

  return await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' }
  })
}
