export const env = {
  appName: 'Sahjog',
  tagline: 'Har Kaam Ka Saathi',
  apiUrl: (import.meta.env.VITE_API_URL ?? 'http://sahjog.runasp.net').replace(/\/+$/, ''),
  /** The business (client) this site belongs to. People can change it on the sign-in page. */
  defaultTenant: import.meta.env.VITE_TENANT ?? '1',
  /** Signed out after this long without a click or key press. Matches the API's refresh-token idle limit. */
  idleLogoutMinutes: 15,
  /** A sleeping free-tier server can take a minute to answer the first request. */
  requestTimeoutMs: 90_000,
} as const
