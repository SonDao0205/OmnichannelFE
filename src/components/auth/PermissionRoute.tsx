import { LoadingOutlined } from '@ant-design/icons'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/authContext'
import { ROUTES } from '../../routes/paths'
import { homeRouteForRoles } from '../../routes/access'
import './auth.css'

type PermissionRouteProps = {
  permission: string
  children: React.ReactNode
}

export default function PermissionRoute({
  permission,
  children,
}: PermissionRouteProps) {
  const { session, isLoading, hasPermission } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="auth-loading" role="status">
        <LoadingOutlined spin />
        <span>Đang kiểm tra quyền truy cập...</span>
      </div>
    )
  }
  if (!session) {
    return <Navigate replace state={{ from: location.pathname }} to={ROUTES.login} />
  }
  if (!hasPermission(permission)) {
    return <Navigate replace to={homeRouteForRoles(session.roles)} />
  }
  return <>{children}</>
}
