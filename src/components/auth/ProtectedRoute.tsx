import { LoadingOutlined } from '@ant-design/icons'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/authContext'
import { ROUTES } from '../../routes/paths'
import './auth.css'

type ProtectedRouteProps = {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="auth-loading" role="status">
        <LoadingOutlined spin />
        <span>Đang kiểm tra phiên đăng nhập...</span>
      </div>
    )
  }

  if (!session) {
    return (
      <Navigate
        replace
        state={{ from: location.pathname }}
        to={ROUTES.login}
      />
    )
  }

  if (session.mustChangePassword) {
    return <Navigate replace to={ROUTES.changePassword} />
  }

  return children
}
