import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// The mock APIs simulate network latency; tests don't need to wait for it.
vi.mock('@/lib/mock', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/mock')>()),
  delay: () => Promise.resolve(),
}))

// jsdom does not implement the <dialog> methods the Modal relies on.
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}

afterEach(() => {
  cleanup()
})
