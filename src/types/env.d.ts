/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_TENANT?: string
  /** Set to run the end-to-end API test (see src/api/api.integration.test.ts). */
  readonly VITE_TEST_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
