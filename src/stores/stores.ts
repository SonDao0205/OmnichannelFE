import { configureStore } from '@reduxjs/toolkit'
import productReducer from './slices/productSlice'
import orderReducer from './slices/orderSlice'
import shipmentReducer from './slices/shipmentSlice'

export const store = configureStore({
  reducer: {
    products: productReducer,
    orders: orderReducer,
    shipments: shipmentReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
