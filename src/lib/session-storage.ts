const tokenKey = 'kurio.session.token'
const guestKey = 'kurio.guest.id'
export const getToken = () => localStorage.getItem(tokenKey)
export function setToken(token: string | null) {
  if (token) localStorage.setItem(tokenKey, token)
  else localStorage.removeItem(tokenKey)
}
export function guestId() {
  let id = localStorage.getItem(guestKey)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(guestKey, id)
  }
  return id
}
export const sessionExpiredEvent = 'kurio:session-expired'
