export type Role = 'customer' | 'vendor' | 'technician' | 'admin' | 'super_admin'

export type BookingStage =
  | 'Requested'
  | 'Accepted'
  | 'Assigned'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected'

export type PaymentMethod = 'UPI' | 'QR' | 'Card' | 'Net Banking' | 'Wallet'
