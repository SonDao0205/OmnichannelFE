import {
  AppstoreOutlined,
  BarChartOutlined,
  CustomerServiceOutlined,
  DownOutlined,
  GiftOutlined,
  InboxOutlined,
  LinkOutlined,
  LogoutOutlined,
  ProductOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  TruckOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { useAuth } from '../../contexts/authContext'
import { ROUTES } from '../../routes/paths'

// Icon SMARTHUB logo (custom S-mark)
function SmartHubIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="none" />
      <path
        d="M6 8C6 7.448 6.448 7 7 7h4a3 3 0 0 1 0 6H7a1 1 0 0 0 0 2h5a1 1 0 0 1 0 2H7a3 3 0 0 1 0-6h4a1 1 0 0 0 0-2H7a1 1 0 0 1-1-1Z"
        fill="white"
      />
      <circle cx="18" cy="7.5" r="2.5" fill="white" />
      <circle cx="18" cy="16.5" r="2.5" fill="white" />
    </svg>
  )
}

type NavigationItem = {
  label: string
  to: string
  icon: ReactNode
  notification?: boolean
}

// Danh sách menu khớp 100% ảnh mẫu
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
    icon: <LinkOutlined />,
  },
  {
    label: 'Quản lý Sản phẩm',
    to: ROUTES.products,
    icon: <ProductOutlined />,
  },
  {
    label: 'Quản lý kho',
    to: ROUTES.warehouse,
    icon: <InboxOutlined />,
  },
  {
    label: 'Quản lý Đơn hàng',
    to: ROUTES.orders,
    icon: <ShoppingCartOutlined />,
  },
  {
    label: 'Vận chuyển',
    to: ROUTES.shipping,
    icon: <TruckOutlined />,
  },
  {
    label: 'Khách hàng CRM',
    to: ROUTES.customers,
    icon: <TeamOutlined />,
  },
  {
    label: 'Nhân viên CSKH',
    to: ROUTES.staff,
    icon: <UserOutlined />,
  },
  {
    label: 'Khuyến mãi',
    to: ROUTES.promotions,
    icon: <GiftOutlined />,
  },
  {
    label: 'Báo cáo doanh số',
    to: ROUTES.analytics,
    icon: <BarChartOutlined />,
  },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { session, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isShopAdmin =
    session?.roles.includes('TENANT_MANAGER') ||
    session?.roles.some((role) =>
      ['SHOPADMIN', 'ROLE_SHOP_ADMIN', 'ADMINSHOP'].includes(role.toUpperCase()) ||
      role.toUpperCase().includes('ADMIN')
    )

  const visibleItems = navigationItems.filter((item) => {
    if (item.to === ROUTES.staff) {
      return !!isShopAdmin
    }
    return true
  })

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
      {/* Brand */}
      <div className="app-brand">
        <NavLink className="app-logo" to={ROUTES.overview}>
          <span className="app-logo-mark" aria-hidden="true">
            <SmartHubIcon />
          </span>
          <span className="app-logo-copy">
            <strong>SMARTHUB</strong>
            <small>MANAGEMENT SUITE</small>
          </span>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="app-navigation" aria-label="Điều hướng chính">
        {visibleItems.map((item) => (
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

      {/* Profile / Logout */}
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
            {initials(session?.user.displayName || 'Khôi Nguyễn')}
          </span>
          <span className="app-profile-copy">
            <strong>{session?.user.displayName || 'Agent Mode'}</strong>
            <small>{session?.tenant.name || 'Khôi Nguyễn'}</small>
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
