import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'

import { marketplaceApi } from '../../apis/marketplaceApi'

const checkedNavigationKeys = new Set<string>()

export default function MarketplaceConnectionNotice({ children }: { children: ReactNode }) {
  const location = useLocation()

  useEffect(() => {
    const navigationKey = `${location.key}:${location.pathname}`
    if (checkedNavigationKeys.has(navigationKey)) return
    checkedNavigationKeys.add(navigationKey)

    marketplaceApi.list()
      .then((connections) => {
        const now = Date.now()
        const hasUsableConnection = connections.some((connection) => {
          if (connection.status !== 'CONNECTED') return false
          if (!connection.tokenExpiresAt) return true
          const expiresAt = new Date(connection.tokenExpiresAt).getTime()
          return Number.isFinite(expiresAt) && expiresAt > now
        })
        if (!hasUsableConnection) {
          toast.warning('Sàn chưa được liên kết hoặc phiên liên kết đã hết hạn. Vui lòng kiểm tra tại trang Liên kết sàn.', {
            toastId: `marketplace-${navigationKey}`,
          })
        }
      })
      .catch(() => {
        toast.warning('Không thể xác minh trạng thái liên kết sàn. Vui lòng kiểm tra lại kết nối.', {
          toastId: `marketplace-check-${navigationKey}`,
        })
      })
  }, [location.key, location.pathname])

  return children
}
