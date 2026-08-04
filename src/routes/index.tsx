import { Navigate, createBrowserRouter } from 'react-router-dom'
import AppLayout from '../components/layouts/AppLayout'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import PasswordChangeRoute from '../components/auth/PasswordChangeRoute'
import AdminRoute from '../components/auth/AdminRoute'
import PermissionRoute from '../components/auth/PermissionRoute'
import MarketplaceConnectionNotice from '../components/marketplace/MarketplaceConnectionNotice'
import AnalystScreen from '../pages/analyst/AnalystScreen'
import AiContextScreen from '../pages/ai-context/AiContextScreen'
import LoginScreen from '../pages/auth/LoginScreen'
import FirstLoginPasswordScreen from '../pages/auth/FirstLoginPasswordScreen'
import ChatScreen from '../pages/chat/ChatScreen'
import ConnectScreen from '../pages/connect/ConnectScreen'
import CustomerScreen from '../pages/customer/CustomerScreen'
import OrderScreen from '../pages/order/OrderScreen'
import LandingScreen from '../pages/landing/LandingScreen'
import OverviewScreen from '../pages/overview/OverviewScreen'
import ProductScreen from '../pages/products/ProductScreen'
import WarehouseScreen from '../pages/warehouse/WarehouseScreen'
import ShippingScreen from '../pages/shipping/ShippingScreen'
import StaffManagementScreen from '../pages/staff/StaffManagementScreen'
import { ROUTES } from './paths'

export const router = createBrowserRouter([
  {
    path: ROUTES.login,
    element: <LoginScreen />,
  },
  {
    path: ROUTES.changePassword,
    element: (
      <PasswordChangeRoute>
        <FirstLoginPasswordScreen />
      </PasswordChangeRoute>
    ),
  },
  {
    path: '/',
    element: <LandingScreen />,
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: ROUTES.overview,
        element: <OverviewScreen />,
      },
      {
        path: ROUTES.connect,
        element: <ConnectScreen />,
      },
      {
        path: ROUTES.products,
        element: <ProductScreen />,
      },
      {
        path: ROUTES.warehouse,
        element: <WarehouseScreen />,
      },
      {
        path: ROUTES.orders,
        element: <MarketplaceConnectionNotice><OrderScreen /></MarketplaceConnectionNotice>,
      },
      {
        path: ROUTES.shipping,
        element: <MarketplaceConnectionNotice><ShippingScreen /></MarketplaceConnectionNotice>,
      },
      {
        path: ROUTES.customers,
        element: <CustomerScreen />,
      },
      {
        path: ROUTES.chat,
        element: <MarketplaceConnectionNotice><ChatScreen /></MarketplaceConnectionNotice>,
      },
      {
        path: ROUTES.analytics,
        element: <AnalystScreen />,
      },
      {
        path: ROUTES.aiContexts,
        element: (
          <PermissionRoute permission="AI.CONFIGURE">
            <AiContextScreen />
          </PermissionRoute>
        ),
      },
      {
        path: ROUTES.staff,
        element: (
          <AdminRoute>
            <StaffManagementScreen />
          </AdminRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate replace to={ROUTES.overview} />,
  },
])
