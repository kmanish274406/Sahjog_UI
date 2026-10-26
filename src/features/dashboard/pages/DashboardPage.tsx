import { Navigate } from 'react-router-dom'
import { ROUTES } from '@/config/routes'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { AdminDashboard } from '../components/AdminDashboard'
import { CustomerHome } from '../components/CustomerHome'
import { TechnicianDashboard } from '../components/TechnicianDashboard'
import { VendorDashboard } from '../components/VendorDashboard'

/** Each role lands on its own home. */
export default function DashboardPage() {
  const role = useAuthStore((state) => state.user?.role)
  switch (role) {
    case 'customer':
      return <CustomerHome />
    case 'vendor':
      return <VendorDashboard />
    case 'technician':
      return <TechnicianDashboard />
    case 'admin':
      return <AdminDashboard />
    case 'super_admin':
      return <Navigate to={ROUTES.clients} replace />
    default:
      return null
  }
}
