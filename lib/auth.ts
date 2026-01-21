import { createClient } from './supabase/server'
import { createAdminClient } from './supabase/admin'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production'
const ALGORITHM = 'aes-256-gcm'

export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv)
  
  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decryptToken(encryptedToken: string): string {
  const parts = encryptedToken.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format')
  }
  
  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]
  
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export async function createOrUpdateProfile(userId: string, email: string, data: Partial<any>) {
  const supabase = createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email,
      ...data,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return profile
}

export async function saveIntegration(
  userId: string,
  provider: string,
  token: string,
  refreshToken?: string,
  expiresAt?: string,
  labelId?: string
) {
  const supabase = createClient()
  const encryptedToken = encryptToken(token)
  const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken) : null
  
  const { data, error } = await supabase
    .from('integrations')
    .upsert({
      user_id: userId,
      provider: provider as any,
      encrypted_token: encryptedToken,
      refresh_token: encryptedRefreshToken,
      expires_at: expiresAt,
      label_id: labelId,
      is_active: true,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,provider'
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getIntegration(userId: string, provider: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('is_active', true)
    .single()
  
  if (error) return null
  return data
}

export async function getDecryptedToken(userId: string, provider: string): Promise<string | null> {
  const integration = await getIntegration(userId, provider)
  if (!integration) return null
  
  try {
    return decryptToken(integration.encrypted_token)
  } catch (error) {
    console.error('Failed to decrypt token:', error)
    return null
  }
}
