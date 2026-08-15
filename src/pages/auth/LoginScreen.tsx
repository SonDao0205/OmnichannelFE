import {
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  MailOutlined,
  ShopOutlined,
} from '@ant-design/icons'
import { type FormEvent, useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { authErrorMessage, authFieldErrors } from '../../apis/authApi'
import { useAuth } from '../../contexts/authContext'
import { ROUTES } from '../../routes/paths'
import { homeRouteForRoles } from '../../routes/access'
import {
  type LoginField,
  type LoginValidationErrors,
  validateLoginCredentials,
} from '../../validation/loginValidation'
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
  const [fieldErrors, setFieldErrors] = useState<LoginValidationErrors>({})

  useEffect(() => {
    document.title = 'SmartHub'
  }, [])

  if (!isLoading && session) {
    return (
      <Navigate
        replace
        to={
          session.mustChangePassword
            ? ROUTES.changePassword
            : homeRouteForRoles(session.roles)
        }
      />
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const validationErrors = validateLoginCredentials({ email, password })
    setFieldErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      const authenticatedSession = await login({
        email: email.trim(),
        password,
      })
      if (authenticatedSession.mustChangePassword) {
        navigate(ROUTES.changePassword, { replace: true })
        return
      }
      const state = location.state as LoginLocationState | null
      navigate(state?.from || homeRouteForRoles(authenticatedSession.roles), { replace: true })
    } catch (loginError) {
      const backendFieldErrors = authFieldErrors(loginError)
      setFieldErrors(backendFieldErrors)
      if (Object.keys(backendFieldErrors).length === 0) {
        setError(authErrorMessage(loginError))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const clearFieldError = (field: LoginField) => {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current
      }
      const next = { ...current }
      delete next[field]
      return next
    })
    setError('')
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
          <p>SMARTHUB MANAGEMENT</p>
          <h1 id="login-title">Đăng nhập hệ thống</h1>
          <span>Sử dụng tài khoản doanh nghiệp đã được quản trị viên cấp.</span>
        </header>

        <form className="login-form" noValidate onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <div
            className={`login-input${fieldErrors.email ? ' is-invalid' : ''}`}
          >
            <MailOutlined aria-hidden="true" />
            <input
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              aria-invalid={Boolean(fieldErrors.email)}
              autoComplete="username"
              autoFocus
              id="email"
              name="email"
              onChange={(event) => {
                setEmail(event.target.value)
                clearFieldError('email')
              }}
              placeholder="name@company.com"
              type="email"
              value={email}
            />
          </div>
          {fieldErrors.email ? (
            <p className="login-field-error" id="email-error" role="alert">
              {fieldErrors.email}
            </p>
          ) : null}

          <label htmlFor="password">Mật khẩu</label>
          <div
            className={`login-input${fieldErrors.password ? ' is-invalid' : ''}`}
          >
            <LockOutlined aria-hidden="true" />
            <input
              aria-describedby={
                fieldErrors.password ? 'password-error' : undefined
              }
              aria-invalid={Boolean(fieldErrors.password)}
              autoComplete="current-password"
              id="password"
              name="password"
              onChange={(event) => {
                setPassword(event.target.value)
                clearFieldError('password')
              }}
              placeholder="Nhập mật khẩu"
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
          {fieldErrors.password ? (
            <p className="login-field-error" id="password-error" role="alert">
              {fieldErrors.password}
            </p>
          ) : null}

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
