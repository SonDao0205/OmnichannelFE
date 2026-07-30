import { LoadingOutlined } from '@ant-design/icons'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/authContext'
import { ROUTES } from '../../routes/paths'
import './auth.css'

type AdminRouteProps = {
  children: React.ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { session, isLoading, hasRole } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="auth-loading" role="status">
        <LoadingOutlined spin />
        <span>Đang kiểm tra quyền truy cập...</span>
      </div>
    )
  }

  // Check if session exists
  if (!session) {
    return (
      <Navigate
        replace
        state={{ from: location.pathname }}
        to={ROUTES.login}
      />
    )
  }

  // Check if the user is a Shop Admin (supporting variations like ShopAdmin, ROLE_SHOP_ADMIN, AdminShop, TENANT_MANAGER, or roles containing 'ADMIN')
  const isShopAdmin =
    hasRole('ShopAdmin') ||
    hasRole('ROLE_SHOP_ADMIN') ||
    hasRole('AdminShop') ||
    hasRole('TENANT_MANAGER') ||
    session.roles.includes('TENANT_MANAGER') ||
    session.roles.some((role) => role.toUpperCase().includes('ADMIN'))

  if (!isShopAdmin) {
    // If not shop admin, redirect to overview page
    return <Navigate replace to={ROUTES.overview} />
  }

  return <>{children}</>
}
