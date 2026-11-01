import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './index'
import { request } from './http'

vi.mock('./http', () => ({ request: vi.fn() }))

describe('admin client API', () => {
  beforeEach(() => {
    vi.mocked(request).mockReset()
  })

  it('uses the approval endpoint and sends the requested state', async () => {
    await api.admin.setUserApproval(8, true)

    expect(request).toHaveBeenCalledWith('/api/admin/users/8/approval', {
      method: 'PUT',
      body: { approved: true },
    })
  })
})
