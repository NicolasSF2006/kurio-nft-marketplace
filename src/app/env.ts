const mocksFlag = import.meta.env.VITE_ENABLE_MOCKS ?? 'false'
if (mocksFlag !== 'true' && mocksFlag !== 'false') {
  throw new Error('VITE_ENABLE_MOCKS deve ser true ou false.')
}

export const env = {
  mocksEnabled: mocksFlag === 'true',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL || window.location.origin,
  mockScenario: import.meta.env.VITE_MOCK_SCENARIO || 'default',
} as const
