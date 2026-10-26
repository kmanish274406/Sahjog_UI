import type { Role } from '@/domain/types'

export type { Role }

export interface AuthUser {
  id: number
  name: string
  role: Role
  phone?: string
  email?: string
}

export interface AuthSession {
  user: AuthUser
  token: string
  refreshToken: string
}
