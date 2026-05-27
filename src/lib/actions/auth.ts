'use server'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { hashPassword, signSession, verifySession } from '@/lib/auth'

export async function loginAction(state: any, formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { success: false, error: 'Username and password are required' }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return { success: false, error: 'Invalid username or password' }
    }

    const hashedPassword = await hashPassword(password)
    if (user.password !== hashedPassword) {
      return { success: false, error: 'Invalid username or password' }
    }

    // Sign session
    const sessionToken = await signSession({
      id: user.id,
      username: user.username,
      role: user.role
    })

    const cookieStore = await cookies()
    cookieStore.set('shakti_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    })

    // Log the successful login
    await prisma.auditLog.create({
      data: {
        username: user.username,
        role: user.role,
        action: 'LOGIN',
        entityType: 'PROFILE',
        details: 'User logged in successfully'
      }
    })

    return { success: true, role: user.role }
  } catch (error) {
    console.error('Login action error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('shakti_session')?.value
    
    if (sessionToken) {
      const decoded = await verifySession(sessionToken)
      if (decoded) {
        await prisma.auditLog.create({
          data: {
            username: decoded.username,
            role: decoded.role,
            action: 'LOGIN',
            entityType: 'PROFILE',
            details: 'User logged out'
          }
        })
      }
    }
    
    cookieStore.delete('shakti_session')
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false, error: 'Failed to log out' }
  }
}
