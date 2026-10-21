import { createContext, useContext } from 'react'

export const NoticeContext = createContext<(message: string) => void>(() => undefined)
export function usePreviewNotice() {
  return useContext(NoticeContext)
}
