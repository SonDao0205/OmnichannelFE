import { Navigate, createBrowserRouter } from 'react-router-dom'
import AppLayout from '../components/layouts/AppLayout'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import PasswordChangeRoute from '../components/auth/PasswordChangeRoute'
import AdminRoute from '../components/auth/AdminRoute'
import AnalystScreen from '../pages/analyst/AnalystScreen'
import LoginScreen from '../pages/auth/LoginScreen'
import FirstLoginPasswordScreen from '../pages/auth/FirstLoginPasswordScreen'
import ChatScreen from '../pages/chat/ChatScreen'
import ConnectScreen from '../pages/connect/ConnectScreen'
import CustomerScreen from '../pages/customer/CustomerScreen'
import OrderScreen from '../pages/order/OrderScreen'
import OverviewScreen from '../pages/overview/OverviewScreen'
import ProductScreen from '../pages/products/ProductScreen'
import WarehouseScreen from '../pages/warehouse/WarehouseScreen'
import ShippingScreen from '../pages/shipping/ShippingScreen'
import PromotionsScreen from '../pages/promotions/PromotionsScreen'
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
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate replace to={ROUTES.overview} />,
      },
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
        element: <OrderScreen />,
      },
      {
        path: ROUTES.shipping,
        element: <ShippingScreen />,
      },
      {
        path: ROUTES.customers,
        element: <CustomerScreen />,
      },
      {
        path: ROUTES.promotions,
        element: <PromotionsScreen />,
      },
      {
        path: ROUTES.chat,
        element: <ChatScreen />,
      },
      {
        path: ROUTES.analytics,
        element: <AnalystScreen />,
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
