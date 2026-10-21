import axios from 'axios'
import { env } from '@/app/env'
import { getToken, guestId, sessionExpiredEvent, setToken } from './session-storage'

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Guest-Id'] = guestId()
  return config
})
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      getToken() &&
      error.config?.headers.Authorization === `Bearer ${getToken()}` &&
      !['/auth/login', '/auth/signup'].includes(error.config?.url ?? '')
    ) {
      setToken(null)
      window.dispatchEvent(new Event(sessionExpiredEvent))
    }
    return Promise.reject(error)
  },
)
