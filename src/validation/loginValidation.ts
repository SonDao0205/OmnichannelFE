import type { LoginCredentials } from '../types/auth'

export type LoginField = keyof LoginCredentials
export type LoginValidationErrors = Partial<Record<LoginField, string>>

export const LOGIN_EMAIL_MAX_LENGTH = 255
export const LOGIN_PASSWORD_MAX_LENGTH = 200

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLoginCredentials(
  credentials: LoginCredentials,
): LoginValidationErrors {
  const errors: LoginValidationErrors = {}
  const email = credentials.email.trim()

  if (!email) {
    errors.email = 'Vui lòng nhập email.'
  } else if (email.length > LOGIN_EMAIL_MAX_LENGTH) {
    errors.email = `Email không được vượt quá ${LOGIN_EMAIL_MAX_LENGTH} ký tự.`
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Email không đúng định dạng.'
  }

  if (!credentials.password.trim()) {
    errors.password = 'Vui lòng nhập mật khẩu.'
  } else if (credentials.password.length > LOGIN_PASSWORD_MAX_LENGTH) {
    errors.password =
      `Mật khẩu không được vượt quá ${LOGIN_PASSWORD_MAX_LENGTH} ký tự.`
  }

  return errors
}
