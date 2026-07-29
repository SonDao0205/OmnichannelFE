import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { productApi } from '../../apis/productApi'
import type { Product, ProductFilter } from '../../types/product'

interface ProductState {
  items: Product[]
  loading: boolean
  error: string | null
  filter: ProductFilter
  selectedProduct: Product | null
  isModalOpen: boolean
}

const initialState: ProductState = {
  items: [],
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

export const fetchProductsThunk = createAsyncThunk('products/fetch', async () => {
  return await productApi.fetchProducts()
})

export const createProductThunk = createAsyncThunk(
  'products/create',
  async (productData: Partial<Product>) => {
    return await productApi.createProduct(productData)
  }
)

export const updateProductThunk = createAsyncThunk(
  'products/update',
  async ({ id, data }: { id: string; data: Partial<Product> }) => {
    return await productApi.updateProduct(id, data)
  }
)

export const deleteProductThunk = createAsyncThunk('products/delete', async (id: string) => {
  return await productApi.deleteProduct(id)
})

export const syncMarketplacesThunk = createAsyncThunk('products/sync', async () => {
  return await productApi.syncMarketplaces()
})

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
        state.loading = true;
        state.error = null
      })
      .addCase(fetchProductsThunk.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
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
  },
})

export const { setTab, setViewMode, setSearch, setPage, openModal, closeModal } =
  productSlice.actions

export default productSlice.reducer
