import { isAxiosError } from 'axios'
import type { ApiError } from '@/types/api'
export function errorMessage(error: unknown) {
  if (isAxiosError<ApiError>(error))
    return error.response?.data.message ?? 'Falha de conexão. Verifique a rede e tente novamente.'
  return 'Não foi possível concluir. Tente novamente.'
}
export function fieldErrors(error: unknown): Record<string, string> {
  return isAxiosError<ApiError>(error) ? (error.response?.data.fields ?? {}) : {}
}
