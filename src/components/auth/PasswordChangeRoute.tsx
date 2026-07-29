import { LoadingOutlined } from '@ant-design/icons'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/authContext'
import { ROUTES } from '../../routes/paths'
import './auth.css'

type PasswordChangeRouteProps = {
  children: React.ReactNode
}

export default function PasswordChangeRoute({
  children,
}: PasswordChangeRouteProps) {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="auth-loading" role="status">
        <LoadingOutlined spin />
        <span>Đang kiểm tra phiên đăng nhập...</span>
      </div>
    )
  }

  if (!session) {
    return <Navigate replace to={ROUTES.login} />
  }

  if (!session.mustChangePassword) {
    return <Navigate replace to={ROUTES.overview} />
  }

  return children
}
