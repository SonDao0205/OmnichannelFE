import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { productApi, productErrorMessage } from '../../apis/productApi'
import type { Product, ProductFilter } from '../../types/product'

interface ProductState {
  items: Product[]
  totalElements: number
  loading: boolean
  error: string | null
  filter: ProductFilter
  selectedProduct: Product | null
  isModalOpen: boolean
}

const initialState: ProductState = {
  items: [],
  totalElements: 0,
  loading: false,
  error: null,
  filter: {
    tab: 'ALL',
    viewMode: 'grid',
    search: '',
    page: 1,
    pageSize: 12,
  },
  selectedProduct: null,
  isModalOpen: false,
}

export const fetchProductsThunk = createAsyncThunk(
  'products/fetch',
  async (_, { getState }: any) => {
    const state = getState() as { products: ProductState }
    const { filter } = state.products
    const status = filter.tab === 'ALL' ? '' : filter.tab
    return await productApi.fetchProducts(filter.search, status, filter.page - 1, filter.pageSize)
  }
)

export const createProductThunk = createAsyncThunk(
  'products/create',
  async (productData: Partial<Product>, { rejectWithValue }) => {
    try {
      return await productApi.createProduct(productData)
    } catch (error) {
      return rejectWithValue(productErrorMessage(error))
    }
  }
)

export const updateProductThunk = createAsyncThunk(
  'products/update',
  async ({ id, data }: { id: string; data: Partial<Product> }, { rejectWithValue }) => {
    try {
      return await productApi.updateProduct(id, data)
    } catch (error) {
      return rejectWithValue(productErrorMessage(error))
    }
  }
)

export const deleteProductThunk = createAsyncThunk(
  'products/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      return await productApi.deleteProduct(id)
    } catch (error) {
      return rejectWithValue(productErrorMessage(error))
    }
  }
)

export const adjustStockThunk = createAsyncThunk(
  'products/adjustStock',
  async ({ id, delta, note }: { id: string; delta: number; note?: string }) => {
    return await productApi.adjustStock(id, delta, note)
  }
)

export const syncMarketplacesThunk = createAsyncThunk(
  'products/sync',
  async (_, { rejectWithValue }) => {
    try {
      return await productApi.syncMarketplaces()
    } catch (error) {
      return rejectWithValue(productErrorMessage(error))
    }
  },
)

export const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setTab: (state, action: PayloadAction<ProductFilter['tab']>) => {
      state.filter.tab = action.payload
      state.filter.page = 1
    },
    setViewMode: (state, action: PayloadAction<'grid' | 'table'>) => {
      state.filter.viewMode = action.payload
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.filter.search = action.payload
      state.filter.page = 1
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.filter.page = action.payload
    },
    openModal: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload
      state.isModalOpen = true
    },
    closeModal: (state) => {
      state.selectedProduct = null
      state.isModalOpen = false
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchProductsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProductsThunk.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        state.totalElements = action.payload.length
      })
      .addCase(fetchProductsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Lỗi tải danh sách sản phẩm'
      })
      // Create
      .addCase(createProductThunk.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      // Update
      .addCase(updateProductThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload }
        }
      })
      // Delete
      .addCase(deleteProductThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload)
      })
      // Adjust stock
      .addCase(adjustStockThunk.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload }
        }
      })
      .addCase(syncMarketplacesThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(syncMarketplacesThunk.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(syncMarketplacesThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Không thể đồng bộ sản phẩm'
      })
  },
})

export const { setTab, setViewMode, setSearch, setPage, openModal, closeModal } =
  productSlice.actions

export default productSlice.reducer
