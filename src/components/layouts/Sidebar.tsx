import {
  ApiOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  CustomerServiceOutlined,
  DownOutlined,
  LogoutOutlined,
  ProductOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { useAuth } from '../../contexts/authContext'
import { ROUTES } from '../../routes/paths'

type NavigationItem = {
  label: string
  to: string
  icon: ReactNode
  notification?: boolean
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Tổng quan',
    to: ROUTES.overview,
    icon: <AppstoreOutlined />,
  },
  {
    label: 'Hội thoại (Chat)',
    to: ROUTES.chat,
    icon: <CustomerServiceOutlined />,
    notification: true,
  },
  {
    label: 'Liên kết sàn',
    to: ROUTES.connect,
    icon: <ApiOutlined />,
  },
  {
    label: 'Quản lý Sản phẩm',
    to: ROUTES.products,
    icon: <ProductOutlined />,
  },
  {
    label: 'Quản lý Đơn hàng',
    to: ROUTES.orders,
    icon: <ShoppingCartOutlined />,
  },
  {
    label: 'Khách hàng CRM',
    to: ROUTES.customers,
    icon: <TeamOutlined />,
  },
  {
    label: 'Báo cáo phân tích',
    to: ROUTES.analytics,
    icon: <BarChartOutlined />,
  },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { session, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    setShowDropdown(false)
    Swal.fire({
      title: 'Xác nhận đăng xuất',
      text: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff5252',
      cancelButtonColor: '#73829a',
      confirmButtonText: 'Đăng xuất',
      cancelButtonText: 'Hủy',
      background: '#10192b',
      color: '#fff',
      iconColor: '#ff5252',
    }).then((result) => {
      if (result.isConfirmed) {
        logout()
          .catch(() => undefined)
          .then(() => navigate(ROUTES.login, { replace: true }))
      }
    })
  }

  return (
    <aside className="app-sidebar">
      <div className="app-brand">
        <NavLink className="app-logo" to={ROUTES.overview}>
          <span className="app-logo-mark" aria-hidden="true">
            <ShopOutlined />
          </span>
          <span className="app-logo-copy">
            <strong>OMNICHANNEL</strong>
            <small>MANAGEMENT SUITE</small>
          </span>
        </NavLink>
      </div>

      <nav className="app-navigation" aria-label="Điều hướng chính">
        {navigationItems.map((item) => (
          <NavLink
            className={({ isActive }) =>
              isActive ? 'app-nav-link is-active' : 'app-nav-link'
            }
            key={item.to}
            to={item.to}
          >
            <span className="app-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="app-nav-label">{item.label}</span>
            {item.notification ? (
              <span
                className="app-nav-notification"
                aria-label="Có thông báo mới"
              />
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="app-profile-container" ref={dropdownRef}>
        {showDropdown && (
          <div className="app-profile-dropdown">
            <button
              className="app-profile-dropdown-item logout"
              onClick={handleLogout}
              type="button"
            >
              <LogoutOutlined />
              <span>Đăng xuất</span>
            </button>
          </div>
        )}
        <button
          className={`app-profile ${showDropdown ? 'is-active' : ''}`}
          onClick={() => setShowDropdown(!showDropdown)}
          type="button"
        >
          <span className="app-profile-avatar">
            {initials(session?.user.displayName)}
          </span>
          <span className="app-profile-copy">
            <strong>{session?.user.displayName}</strong>
            <small>{session?.tenant.name}</small>
          </span>
          <DownOutlined className={`app-profile-arrow ${showDropdown ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </aside>
  )
}

function initials(displayName?: string): string {
  if (!displayName) return 'U'
  return displayName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}
