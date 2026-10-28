/**
 * Access ids, named `<ENTITY>_<ACTION>` like the Pharmacy console's. They mirror the API's catalog
 * (SahjogApi.Persistence/Context/AccessCatalog.cs); which role holds which id is data, set by the platform owner on the
 * Roles screen and loaded by `usePermission`. Hiding a button is only cosmetic: the API refuses what the role lacks.
 */
export const PERMISSIONS = {
  clientView: 'CLIENT_VIEW',
  clientAdd: 'CLIENT_ADD',
  clientActivate: 'CLIENT_ACTIVATE',
  clientFeatures: 'CLIENT_FEATURES',
  masterView: 'MASTER_VIEW',
  masterAdd: 'MASTER_ADD',
  masterEdit: 'MASTER_EDIT',
  masterDelete: 'MASTER_DELETE',
  adminRoleView: 'ADMIN_ROLE_VIEW',
  adminRoleEdit: 'ADMIN_ROLE_EDIT',
  roleView: 'ROLE_VIEW',
  roleAdd: 'ROLE_ADD',
  roleEdit: 'ROLE_EDIT',
  roleDelete: 'ROLE_DELETE',
  staffView: 'STAFF_VIEW',
  staffAdd: 'STAFF_ADD',
  staffEdit: 'STAFF_EDIT',
  reportView: 'REPORT_VIEW',
  userView: 'USER_VIEW',
  userEdit: 'USER_EDIT',
  userExtend: 'USER_EXTEND',
  paymentView: 'PAYMENT_VIEW',
  paymentRefund: 'PAYMENT_REFUND',
  categoryAdd: 'CATEGORY_ADD',
  categoryEdit: 'CATEGORY_EDIT',
  serviceAdd: 'SERVICE_ADD',
  serviceEdit: 'SERVICE_EDIT',
  contentAdd: 'CONTENT_ADD',
  contentEdit: 'CONTENT_EDIT',
  contentDelete: 'CONTENT_DELETE',
  feesEdit: 'FEES_EDIT',
  couponEdit: 'COUPON_EDIT',
  paymentMethodEdit: 'PAYMENT_METHOD_EDIT',
  planEdit: 'PLAN_EDIT',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/** One id, or several of which any one is enough (a screen with several buttons shows its menu link to a role that has any). */
export type PermissionRule = Permission | Permission[]
