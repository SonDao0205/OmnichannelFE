import { ROUTES } from './paths'

function normalizedRole(role: string) {
  return role.trim().toUpperCase().replace(/^ROLE_/, '')
}

export function isCustomerSupportRole(roles: string[]) {
  return roles.some((role) => normalizedRole(role) === 'CS_AGENT')
}

export function homeRouteForRoles(roles: string[]) {
  return isCustomerSupportRole(roles) ? ROUTES.chat : ROUTES.overview
}
