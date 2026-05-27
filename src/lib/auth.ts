import { cookies } from 'next/headers'

const SECRET_KEY = process.env.SESSION_SECRET || 'shakti_exports_secret_key_1234567890'

// Simple SHA-256 password hash using standard Web Crypto (compatible with Edge/Node)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'shakti_salt_99')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Simple Base64 URL Safe Helpers
function base64UrlEncode(str: string): string {
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return atob(base64)
}

// Web Crypto HMAC signature generator
async function getSignature(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(SECRET_KEY)
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  const hashArray = Array.from(new Uint8Array(signatureBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function signSession(payload: { id: number; username: string; role: string }): Promise<string> {
  const payloadStr = JSON.stringify(payload)
  const encodedPayload = base64UrlEncode(payloadStr)
  const signature = await getSignature(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export async function verifySession(token: string): Promise<{ id: number; username: string; role: string } | null> {
  try {
    const [encodedPayload, signature] = token.split('.')
    if (!encodedPayload || !signature) return null
    
    const expectedSignature = await getSignature(encodedPayload)
    if (signature !== expectedSignature) return null
    
    const decodedPayload = base64UrlDecode(encodedPayload)
    return JSON.parse(decodedPayload)
  } catch (e) {
    return null
  }
}

export async function getAuthSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('shakti_session')?.value
  if (!token) return null
  return verifySession(token)
}
