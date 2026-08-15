import {
  CheckCircleFilled,
  EyeInvisibleOutlined,
  EyeOutlined,
  KeyOutlined,
  LockOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authErrorMessage } from '../../apis/authApi'
import { useAuth } from '../../contexts/authContext'
import { ROUTES } from '../../routes/paths'
import { homeRouteForRoles } from '../../routes/access'
import './login.css'

export default function FirstLoginPasswordScreen() {
  const { session, changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'SmartHub'
  }, [])

  const requirements = useMemo(
    () => [
      { label: 'Từ 12 đến 128 ký tự', met: newPassword.length >= 12 && newPassword.length <= 128 },
      { label: 'Có chữ hoa và chữ thường', met: /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) },
      { label: 'Có ít nhất một chữ số', met: /\d/.test(newPassword) },
      { label: 'Có ít nhất một ký tự đặc biệt', met: /[^A-Za-z0-9]/.test(newPassword) },
    ],
    [newPassword],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu mới không khớp.')
      return
    }
    setIsSubmitting(true)
    try {
      const updatedSession = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })
      navigate(homeRouteForRoles(updatedSession.roles), { replace: true })
    } catch (changeError) {
      setError(authErrorMessage(changeError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    logout()
      .catch(() => undefined)
      .then(() => navigate(ROUTES.login, { replace: true }))
  }

  return (
    <main className="login-page password-change-page">
      <section className="login-card password-change-card" aria-labelledby="change-password-title">
        <div className="login-brand" aria-hidden="true">
          <span>
            <KeyOutlined />
          </span>
        </div>
        <header className="login-heading">
          <p>THIẾT LẬP TÀI KHOẢN</p>
          <h1 id="change-password-title">Tạo mật khẩu mới</h1>
          <span>
            Chào {session?.user.displayName}. Bạn cần đổi mật khẩu tạm thời
            trước khi sử dụng hệ thống.
          </span>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <PasswordInput
            autoComplete="current-password"
            id="current-password"
            label="Mật khẩu tạm thời"
            onChange={setCurrentPassword}
            placeholder="Nhập mật khẩu đã được cấp"
            show={showPasswords}
            value={currentPassword}
          />
          <PasswordInput
            autoComplete="new-password"
            id="new-password"
            label="Mật khẩu mới"
            onChange={setNewPassword}
            placeholder="Nhập mật khẩu mới"
            show={showPasswords}
            value={newPassword}
          />
          <PasswordInput
            autoComplete="new-password"
            id="confirm-password"
            label="Xác nhận mật khẩu mới"
            onChange={setConfirmPassword}
            placeholder="Nhập lại mật khẩu mới"
            show={showPasswords}
            value={confirmPassword}
          />

          <button
            className="password-visibility"
            onClick={() => setShowPasswords((current) => !current)}
            type="button"
          >
            {showPasswords ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            {showPasswords ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          </button>

          <div className="password-requirements">
            {requirements.map((requirement) => (
              <span className={requirement.met ? 'is-met' : ''} key={requirement.label}>
                <CheckCircleFilled />
                {requirement.label}
              </span>
            ))}
          </div>

          {error ? (
            <div className="login-error" role="alert">
              {error}
            </div>
          ) : null}

          <button
            className="login-submit"
            disabled={isSubmitting || !requirements.every((item) => item.met)}
            type="submit"
          >
            {isSubmitting ? 'Đang cập nhật...' : 'Đổi mật khẩu và tiếp tục'}
          </button>
        </form>

        <button className="password-logout" onClick={handleLogout} type="button">
          <LogoutOutlined />
          Đăng xuất tài khoản
        </button>
      </section>
    </main>
  )
}

type PasswordInputProps = {
  id: string
  label: string
  value: string
  placeholder: string
  autoComplete: string
  show: boolean
  onChange: (value: string) => void
}

function PasswordInput({
  id,
  label,
  value,
  placeholder,
  autoComplete,
  show,
  onChange,
}: PasswordInputProps) {
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <div className="login-input">
        <LockOutlined aria-hidden="true" />
        <input
          autoComplete={autoComplete}
          id={id}
          maxLength={128}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
          type={show ? 'text' : 'password'}
          value={value}
        />
      </div>
    </>
  )
}
