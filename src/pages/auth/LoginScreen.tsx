import {
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  MailOutlined,
  ShopOutlined,
} from '@ant-design/icons'
import { type FormEvent, useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { authErrorMessage } from '../../apis/authApi'
import { useAuth } from '../../contexts/authContext'
import { ROUTES } from '../../routes/paths'
import './login.css'

type LoginLocationState = {
  from?: string
}

export default function LoginScreen() {
  const { session, isLoading, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Đăng nhập | Omnichannel'
  }, [])

  if (!isLoading && session) {
    return (
      <Navigate
        replace
        to={
          session.mustChangePassword
            ? ROUTES.changePassword
            : ROUTES.overview
        }
      />
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const authenticatedSession = await login({ email, password })
      if (authenticatedSession.mustChangePassword) {
        navigate(ROUTES.changePassword, { replace: true })
        return
      }
      const state = location.state as LoginLocationState | null
      navigate(state?.from || ROUTES.overview, { replace: true })
    } catch (loginError) {
      setError(authErrorMessage(loginError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand" aria-hidden="true">
          <span>
            <ShopOutlined />
          </span>
        </div>
        <header className="login-heading">
          <p>OMNICHANNEL MANAGEMENT</p>
          <h1 id="login-title">Đăng nhập hệ thống</h1>
          <span>Sử dụng tài khoản doanh nghiệp đã được quản trị viên cấp.</span>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <div className="login-input">
            <MailOutlined aria-hidden="true" />
            <input
              autoComplete="username"
              autoFocus
              id="email"
              maxLength={255}
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              required
              type="email"
              value={email}
            />
          </div>

          <label htmlFor="password">Mật khẩu</label>
          <div className="login-input">
            <LockOutlined aria-hidden="true" />
            <input
              autoComplete="current-password"
              id="password"
              maxLength={200}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu"
              required
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
            <button
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="login-password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </button>
          </div>

          {error ? (
            <div className="login-error" role="alert">
              {error}
            </div>
          ) : null}

          <button
            className="login-submit"
            disabled={isSubmitting || isLoading}
            type="submit"
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <footer className="login-footer">
          Liên hệ quản trị viên nếu bạn chưa có tài khoản hoặc quên mật khẩu.
        </footer>
      </section>
    </main>
  )
}
