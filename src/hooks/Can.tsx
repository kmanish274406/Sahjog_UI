import type { ReactNode } from 'react'
import type { PermissionRule } from '@/config/permissions'
import { usePermission } from '@/hooks/usePermission'

/** Shows its children only to a role that has been granted the access id: wrap every action button in it. */
export function Can({ permission, children }: { permission: PermissionRule; children: ReactNode }) {
  return usePermission()(permission) ? <>{children}</> : null
}
