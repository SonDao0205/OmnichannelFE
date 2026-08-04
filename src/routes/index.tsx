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
        element: <AdminRoute><OverviewScreen /></AdminRoute>,
      },
      {
        path: ROUTES.connect,
        element: <AdminRoute><ConnectScreen /></AdminRoute>,
      },
      {
        path: ROUTES.products,
        element: (
          <PermissionRoute permission="PRODUCT.READ">
            <ProductScreen />
          </PermissionRoute>
        ),
      },
      {
        path: ROUTES.warehouse,
        element: <AdminRoute><WarehouseScreen /></AdminRoute>,
      },
      {
        path: ROUTES.orders,
        element: (
          <PermissionRoute permission="ORDER.READ">
            <MarketplaceConnectionNotice><OrderScreen /></MarketplaceConnectionNotice>
          </PermissionRoute>
        ),
      },
      {
        path: ROUTES.customers,
        element: <CustomerScreen />,
      },
      {
        path: ROUTES.chat,
        element: (
          <PermissionRoute permission="CHAT.READ">
            <MarketplaceConnectionNotice><ChatScreen /></MarketplaceConnectionNotice>
          </PermissionRoute>
        ),
      },
      {
        path: ROUTES.analytics,
        element: <AdminRoute><AnalystScreen /></AdminRoute>,
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
