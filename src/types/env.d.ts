/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_TENANT?: string
  /** Set to run the end-to-end API test (see src/api/api.integration.test.ts). */
  readonly VITE_TEST_API?: string
  /** The platform owner's login for the live API test (the one the API was started with). */
  readonly VITE_TEST_OWNER_EMAIL?: string
  readonly VITE_TEST_OWNER_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
