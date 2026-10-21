import type { ApiError } from '@/types/api'
import type { Database } from './state'

export class Failure extends Error {
  status: number
  body: ApiError
  constructor(status: number, body: ApiError) {
    super(body.message)
    this.status = status
    this.body = body
  }
}
export function fail(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
): never {
  throw new Failure(status, { code, message, ...(fields ? { fields } : {}) })
}
export function currentUser(db: Database, request: Request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''
  const session = db.sessions[token]
  if (!session || session.expiresAt <= Date.now() || db.scenario === 'expired-session')
    fail(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.')
  const user = db.users.find((user) => user.profile.id === session.userId)
  if (!user) fail(401, 'SESSION_INVALID', 'Entre novamente.')
  return { user, session, token }
}
