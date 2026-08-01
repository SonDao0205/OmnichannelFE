import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ClockCircleOutlined,
  DatabaseOutlined,
  DollarOutlined,
  FileExcelOutlined,
  MoreOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Input, InputNumber, Modal, Select, message } from 'antd'
import { productApi, productErrorMessage } from '../../apis/productApi'
import type { Product } from '../../types/product'
import { exportWarehouseExcel } from '../../utils/excelExport'
import './warehouse.css'

type WhStockStatus = 'LOW' | 'NORMAL' | 'OVERSTOCK'
type StockAction = 'IN' | 'OUT' | 'ADJUST'

interface WhVariant {
  id: string
  name: string
  sku: string
  price: number
  stock: number
}

interface WhProduct {
  id: string
  name: string
  category: string
  costPrice: number
  quantity: number
  minStock: number
  maxStock: number
  imageUrl?: string
  daysInStock: number
  sourceOrder: number
  variants: WhVariant[]
}

const PAGE_SIZE = 10

function getStockStatus(product: WhProduct): WhStockStatus {
  if (product.quantity <= product.minStock) return 'LOW'
  if (product.quantity >= product.maxStock) return 'OVERSTOCK'
  return 'NORMAL'
}

function toWarehouseProduct(product: Product, sourceOrder: number): WhProduct {
  const minStock = product.minStockAlert ?? 5
  const createdAt = product.createdAt ? new Date(product.createdAt).getTime() : Date.now()
  return {
    id: product.id,
    name: product.name,
    category: product.category || 'Chưa phân loại',
    costPrice: product.costPrice,
    quantity: product.totalStock,
    minStock,
    // Hệ thống chưa có cột ngưỡng tồn tối đa; đây là ngưỡng đề xuất từ mức tồn tối thiểu.
    maxStock: Math.max(100, minStock * 10),
    imageUrl: product.imageUrl,
    daysInStock: Math.max(0, Math.floor((Date.now() - createdAt) / 86_400_000)),
    sourceOrder,
    variants: product.variants.map(variant => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      price: variant.price,
      stock: variant.stock,
    })),
  }
}

function formatVND(value: number) {
  return `${value.toLocaleString('vi-VN')}đ`
}

function formatValue(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  return formatVND(value)
}

export default function WarehouseScreen() {
  const [products, setProducts] = useState<WhProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortMode, setSortMode] = useState<'qty_desc' | 'updated'>('qty_desc')
  const [page, setPage] = useState(1)

  const [operationOpen, setOperationOpen] = useState(false)
  const [operationType, setOperationType] = useState<StockAction>('IN')
  const [operationProductId, setOperationProductId] = useState('')
  const [operationVariantId, setOperationVariantId] = useState('')
  const [operationQuantity, setOperationQuantity] = useState<number | null>(null)
  const [operationNote, setOperationNote] = useState('')
  const [savingOperation, setSavingOperation] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [operationErrors, setOperationErrors] = useState<Record<string, string>>({})
  const [detailProductId, setDetailProductId] = useState('')

  const loadProducts = useCallback(async (showSuccess = false) => {
    setLoading(true)
    try {
      const items = await productApi.fetchAllProducts()
      setProducts(items.map(toWarehouseProduct))
      setLoadError('')
      setLastUpdated(new Date())
      if (showSuccess) message.success('Đã làm mới dữ liệu kho')
    } catch (error) {
      setLoadError(productErrorMessage(error) || 'Không thể tải dữ liệu kho hàng')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProducts(), 0)
    return () => window.clearTimeout(timer)
  }, [loadProducts])

  const categories = useMemo(
    () => ['ALL', ...Array.from(new Set(products.map(product => product.category)))],
    [products],
  )

  const displayed = useMemo(() => {
    let list = [...products]
    const query = search.trim().toLowerCase()
    if (query) {
      list = list.filter(product =>
        product.name.toLowerCase().includes(query)
        || product.variants.some(variant => variant.sku.toLowerCase().includes(query)),
      )
    }
    if (categoryFilter !== 'ALL') list = list.filter(product => product.category === categoryFilter)
    if (statusFilter !== 'ALL') list = list.filter(product => getStockStatus(product) === statusFilter)
    if (sortMode === 'qty_desc') list.sort((a, b) => b.quantity - a.quantity)
    if (sortMode === 'updated') list.sort((a, b) => a.sourceOrder - b.sourceOrder)
    return list
  }, [categoryFilter, products, search, sortMode, statusFilter])

  const totalPages = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageProducts = displayed.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const lowStockItems = products.filter(product => getStockStatus(product) === 'LOW')
  const slowMoving = products.filter(product => product.daysInStock > 90)
  const totalValue = products.reduce((sum, product) => sum + product.costPrice * product.quantity, 0)
  const totalSkuCount = products.reduce((sum, product) => sum + product.variants.length, 0)
  const selectedProduct = products.find(product => product.id === operationProductId)
  const selectedVariant = selectedProduct?.variants.find(variant => variant.id === operationVariantId)
  const detailProduct = products.find(product => product.id === detailProductId)

  function updateSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function openOperation(type: StockAction, product?: WhProduct) {
    const targetProduct = product ?? products[0]
    if (!targetProduct) {
      message.warning('Chưa có sản phẩm để thao tác kho')
      return
    }
    if (targetProduct.variants.length === 0) {
      message.warning('Sản phẩm chưa có SKU để điều chỉnh tồn kho')
      return
    }
    setOperationType(type)
    setOperationProductId(targetProduct.id)
    setOperationVariantId(targetProduct.variants[0].id)
    setOperationQuantity(null)
    setOperationNote('')
    setOperationErrors({})
    setOperationOpen(true)
  }

  function changeOperationProduct(productId: string) {
    const product = products.find(item => item.id === productId)
    setOperationProductId(productId)
    setOperationVariantId(product?.variants[0]?.id ?? '')
    setOperationQuantity(null)
    setOperationErrors(previous => ({ ...previous, product: '', variant: '', quantity: '' }))
  }

  async function saveOperation() {
    const errors: Record<string, string> = {}
    if (!selectedProduct || !selectedVariant) {
      if (!selectedProduct) errors.product = 'Vui lòng chọn sản phẩm.'
      if (!selectedVariant) errors.variant = 'Vui lòng chọn SKU / phân loại.'
    }
    if (operationQuantity === null || operationQuantity < 0 || (operationType !== 'ADJUST' && operationQuantity === 0)) {
      errors.quantity = operationType === 'ADJUST' ? 'Tồn thực tế phải từ 0 trở lên.' : 'Số lượng phải lớn hơn 0.'
    }
    if (!operationNote.trim()) {
      errors.note = 'Vui lòng nhập lý do hoặc ghi chú.'
    }
    if (Object.keys(errors).length > 0) {
      setOperationErrors(errors)
      return
    }

    if (!selectedProduct || !selectedVariant || operationQuantity === null) return

    const delta = operationType === 'IN'
      ? operationQuantity
      : operationType === 'OUT'
        ? -operationQuantity
        : operationQuantity - selectedVariant.stock

    if (delta === 0) {
      setOperationErrors({ quantity: 'Tồn thực tế đang bằng tồn hiện tại, chưa có thay đổi.' })
      return
    }
    if (selectedVariant.stock + delta < 0) {
      setOperationErrors({ quantity: `SKU ${selectedVariant.sku} chỉ còn ${selectedVariant.stock} sản phẩm.` })
      return
    }

    setSavingOperation(true)
    try {
      await productApi.adjustStock(selectedProduct.id, delta, operationNote.trim(), selectedVariant.id)
      const actionLabel = operationType === 'IN' ? 'Nhập kho' : operationType === 'OUT' ? 'Xuất kho' : 'Kiểm kê'
      message.success(`${actionLabel} SKU ${selectedVariant.sku} thành công`)
      setOperationOpen(false)
      await loadProducts()
    } catch (error) {
      setOperationErrors({ server: productErrorMessage(error) })
    } finally {
      setSavingOperation(false)
    }
  }

  async function exportExcel() {
    if (displayed.length === 0) {
      message.warning('Không có dữ liệu để xuất')
      return
    }
    setExporting(true)
    try {
      await exportWarehouseExcel(displayed.map(product => ({
        name: product.name,
        category: product.category,
        costPrice: product.costPrice,
        quantity: product.quantity,
        minStock: product.minStock,
        maxStock: product.maxStock,
        status: getStockStatus(product),
        variants: product.variants,
      })))
      message.success('Đã xuất báo cáo kho định dạng Excel (.xlsx)')
    } catch {
      message.error('Không thể tạo file Excel. Vui lòng thử lại.')
    } finally {
      setExporting(false)
    }
  }

  const operationTitle = operationType === 'IN'
    ? 'Nhập kho mới'
    : operationType === 'OUT'
      ? 'Xuất / xả hàng'
      : 'Điều chỉnh theo kiểm kê'

  return (
    <div className="wh-page">
      <div className="wh-header">
        <div className="wh-header-left">
          <h1>Quản lý kho hàng</h1>
          <span className="wh-updated-badge">
            {lastUpdated ? `Cập nhật: ${lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Đang cập nhật'}
          </span>
        </div>
        <div className="wh-header-actions">
          <button className="btn-export-excel" type="button" onClick={() => void loadProducts(true)} disabled={loading}>
            <ReloadOutlined /> Làm mới
          </button>
          <button className="btn-export-excel" type="button" onClick={() => void exportExcel()} disabled={exporting}>
            <FileExcelOutlined /> Xuất Excel
          </button>
          <button className="btn-import-stock" type="button" onClick={() => openOperation('IN')}>
            <PlusOutlined /> Nhập kho mới
          </button>
        </div>
      </div>

      <div className="wh-stats-grid">
        <div className="wh-stat-card">
          <div className="wh-stat-label red">Sắp hết hàng (theo mức tối thiểu)</div>
          <div className="wh-stat-number-row"><span className="wh-stat-number red">{String(lowStockItems.length).padStart(2, '0')}</span><span className="wh-stat-unit">Sản phẩm</span></div>
          <div className="wh-stat-desc">Cần bổ sung tồn kho sớm</div>
          <div className="wh-stat-icon red"><WarningOutlined /></div>
        </div>
        <div className="wh-stat-card">
          <div className="wh-stat-label orange">Tồn kho lâu (&gt; 90 ngày)</div>
          <div className="wh-stat-number-row"><span className="wh-stat-number orange">{slowMoving.reduce((sum, product) => sum + product.quantity, 0)}</span><span className="wh-stat-unit">Đơn vị</span></div>
          <div className="wh-stat-desc">Tính theo ngày tạo sản phẩm hiện có</div>
          <div className="wh-stat-icon orange"><ClockCircleOutlined /></div>
        </div>
        <div className="wh-stat-card">
          <div className="wh-stat-label blue">Tổng phân loại hoạt động</div>
          <div className="wh-stat-number-row"><span className="wh-stat-number blue">{totalSkuCount.toLocaleString('vi-VN')}</span><span className="wh-stat-unit">SKU</span></div>
          <div className="wh-stat-desc">Dữ liệu SKU lấy từ hệ thống</div>
          <div className="wh-stat-icon blue"><DatabaseOutlined /></div>
        </div>
        <div className="wh-stat-card">
          <div className="wh-stat-label teal">Giá trị tổng kho hàng</div>
          <div className="wh-stat-number-row"><span className="wh-stat-number teal">{formatValue(totalValue)}</span><span className="wh-stat-unit">VNĐ</span></div>
          <div className="wh-stat-desc">Tính theo giá vốn và tồn thực tế</div>
          <div className="wh-stat-icon teal"><DollarOutlined /></div>
        </div>
      </div>

      <div className="wh-filter-bar">
        <div className="wh-search-wrap">
          <SearchOutlined className="wh-search-icon" />
          <input className="wh-search-input" placeholder="Tìm tên sản phẩm, mã SKU..." value={search} onChange={event => updateSearch(event.target.value)} />
        </div>
        <select className="wh-filter-select" value={categoryFilter} onChange={event => { setCategoryFilter(event.target.value); setPage(1) }}>
          {categories.map(category => <option key={category} value={category}>{category === 'ALL' ? 'Tất cả danh mục' : category}</option>)}
        </select>
        <select className="wh-filter-select" value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setPage(1) }}>
          <option value="ALL">Trạng thái: Tất cả</option>
          <option value="LOW">Sắp hết hàng</option>
          <option value="NORMAL">Còn hàng an toàn</option>
          <option value="OVERSTOCK">Tồn vượt mức đề xuất</option>
        </select>
        <div className="wh-sort-group">
          <span className="wh-sort-label">Sắp xếp:</span>
          <button className={`btn-sort ${sortMode === 'qty_desc' ? 'active' : ''}`} onClick={() => { setSortMode('qty_desc'); setPage(1) }} type="button">Tồn kho giảm dần</button>
          <button className={`btn-sort ${sortMode === 'updated' ? 'active' : ''}`} onClick={() => { setSortMode('updated'); setPage(1) }} type="button">Mới cập nhật</button>
        </div>
      </div>

      <div className="wh-table-container">
        <table className="wh-table">
          <colgroup><col className="col-img" /><col className="col-info" /><col className="col-cat" /><col className="col-price" /><col className="col-qty" /><col className="col-status" /><col className="col-action" /></colgroup>
          <thead><tr><th>Ảnh</th><th>Thông tin sản phẩm / SKU</th><th>Danh mục</th><th>Giá vốn nhập</th><th>Số lượng tồn</th><th>Trạng thái kho</th><th>Hành động</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="wh-empty-cell">Đang tải dữ liệu kho hàng...</td></tr>
            ) : loadError ? (
              <tr><td colSpan={7} className="wh-empty-cell error">{loadError}<button type="button" onClick={() => void loadProducts()}>Thử lại</button></td></tr>
            ) : pageProducts.length === 0 ? (
              <tr><td colSpan={7} className="wh-empty-cell">Không tìm thấy sản phẩm nào</td></tr>
            ) : pageProducts.map(product => {
              const status = getStockStatus(product)
              const qtyClass = status === 'LOW' ? 'low' : status === 'OVERSTOCK' ? 'overstock' : 'normal'
              const progress = Math.max(product.quantity > 0 ? 4 : 0, Math.min(100, (product.quantity / product.maxStock) * 100))
              const qtySubtext = status === 'LOW'
                ? `Mức tối thiểu: ${product.minStock}`
                : status === 'OVERSTOCK'
                  ? `Ngưỡng đề xuất: ${product.maxStock}`
                  : `Cao hơn tối thiểu: ${product.quantity - product.minStock}`
              return (
                <tr key={product.id}>
                  <td>{product.imageUrl ? <div className="wh-product-thumb"><img src={product.imageUrl} alt={product.name} /></div> : <div className="wh-product-thumb-placeholder"><PictureOutlined /></div>}</td>
                  <td><div className="wh-prod-name" title={product.name}>{product.name}</div><div className="wh-prod-skus">SKU: {product.variants.map(variant => variant.sku).join(' · ') || 'Chưa có SKU'}</div></td>
                  <td><span className="wh-cat-text">{product.category}</span></td>
                  <td><span className="wh-price">{formatVND(product.costPrice)}</span></td>
                  <td><div className={`wh-qty-number ${qtyClass}`}>{product.quantity.toLocaleString('vi-VN')}</div><div className="wh-qty-sub">{qtySubtext}</div><div className="wh-qty-bar"><div className={`wh-qty-bar-fill ${qtyClass}`} style={{ width: `${progress}%` }} /></div></td>
                  <td>{status === 'LOW' ? <span className="wh-status-badge chayhang"><i /> Sắp hết hàng</span> : status === 'OVERSTOCK' ? <span className="wh-status-badge vuotmuc"><i /> Tồn vượt mức</span> : <span className="wh-status-badge antoan"><i /> Còn hàng an toàn</span>}</td>
                  <td>
                    <div className="wh-action-group">
                      {status === 'LOW' && <button className="btn-nhap-hang" type="button" onClick={() => openOperation('IN', product)}>Nhập hàng</button>}
                      {status === 'OVERSTOCK' && <button className="btn-xa-hang" type="button" onClick={() => openOperation('OUT', product)}>Xả hàng</button>}
                      <button className="btn-wh-action" type="button" title="Xem chi tiết" onClick={() => setDetailProductId(product.id)}><MoreOutlined /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="wh-pagination-bar">
          <div>Hiển thị {displayed.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, displayed.length)} trong {displayed.length} sản phẩm · {totalSkuCount.toLocaleString('vi-VN')} SKU</div>
          <div className="wh-pagination-controls">
            <button className="wh-page-btn" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} type="button">‹</button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(pageNumber => <button key={pageNumber} className={`wh-page-btn ${pageNumber === currentPage ? 'active' : ''}`} onClick={() => setPage(pageNumber)} type="button">{pageNumber}</button>)}
            <button className="wh-page-btn" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} type="button">›</button>
          </div>
        </div>
      </div>

      <Modal title={operationTitle} open={operationOpen} onCancel={() => setOperationOpen(false)} onOk={() => void saveOperation()} okText="Xác nhận" cancelText="Hủy" confirmLoading={savingOperation} destroyOnHidden>
        <div className="wh-operation-form">
          {operationErrors.server && <div className="wh-modal-error-summary" role="alert">{operationErrors.server}</div>}
          <label>Loại thao tác</label>
          <Select value={operationType} onChange={value => { setOperationType(value); setOperationQuantity(null); setOperationErrors({}) }} options={[{ value: 'IN', label: 'Nhập thêm hàng' }, { value: 'OUT', label: 'Xuất / xả hàng' }, { value: 'ADJUST', label: 'Điều chỉnh theo tồn kiểm kê' }]} />
          <label>Sản phẩm</label>
          <Select status={operationErrors.product ? 'error' : undefined} showSearch optionFilterProp="label" value={operationProductId || undefined} onChange={changeOperationProduct} options={products.map(product => ({ value: product.id, label: product.name }))} />
          {operationErrors.product && <div className="wh-field-error">{operationErrors.product}</div>}
          <label>SKU / Phân loại</label>
          <Select status={operationErrors.variant ? 'error' : undefined} value={operationVariantId || undefined} onChange={value => { setOperationVariantId(value); setOperationQuantity(null); setOperationErrors(previous => ({ ...previous, variant: '', quantity: '' })) }} options={(selectedProduct?.variants ?? []).map(variant => ({ value: variant.id, label: `${variant.sku} — ${variant.name} (tồn ${variant.stock})` }))} />
          {operationErrors.variant && <div className="wh-field-error">{operationErrors.variant}</div>}
          <div className="wh-current-stock">Tồn hiện tại: <strong>{selectedVariant?.stock ?? 0}</strong> sản phẩm</div>
          <label>{operationType === 'ADJUST' ? 'Số lượng tồn thực tế' : 'Số lượng'}</label>
          <InputNumber status={operationErrors.quantity ? 'error' : undefined} min={operationType === 'ADJUST' ? 0 : 1} precision={0} value={operationQuantity} onChange={value => { setOperationQuantity(value); setOperationErrors(previous => ({ ...previous, quantity: '' })) }} placeholder={operationType === 'ADJUST' ? 'Nhập số lượng đếm thực tế' : 'Nhập số lượng'} style={{ width: '100%' }} />
          {operationErrors.quantity && <div className="wh-field-error">{operationErrors.quantity}</div>}
          <label>Lý do / ghi chú <span>*</span></label>
          <Input.TextArea status={operationErrors.note ? 'error' : undefined} value={operationNote} onChange={event => { setOperationNote(event.target.value); setOperationErrors(previous => ({ ...previous, note: '' })) }} placeholder="Ví dụ: Nhập hàng từ nhà cung cấp, xả hàng chậm bán, kiểm kê cuối ngày..." rows={3} maxLength={300} showCount />
          {operationErrors.note && <div className="wh-field-error">{operationErrors.note}</div>}
          {selectedVariant && operationQuantity !== null && <div className="wh-stock-preview">Tồn sau thao tác: <strong>{operationType === 'IN' ? selectedVariant.stock + operationQuantity : operationType === 'OUT' ? selectedVariant.stock - operationQuantity : operationQuantity}</strong></div>}
        </div>
      </Modal>

      <Modal title="Chi tiết tồn kho" open={Boolean(detailProduct)} onCancel={() => setDetailProductId('')} footer={null} width={720} destroyOnHidden>
        {detailProduct && <div className="wh-detail">
          <div className="wh-detail-summary">
            <div><span>Sản phẩm</span><strong>{detailProduct.name}</strong></div>
            <div><span>Danh mục</span><strong>{detailProduct.category}</strong></div>
            <div><span>Tổng tồn</span><strong>{detailProduct.quantity.toLocaleString('vi-VN')}</strong></div>
            <div><span>Giá trị tồn</span><strong>{formatVND(detailProduct.costPrice * detailProduct.quantity)}</strong></div>
          </div>
          <div className="wh-detail-table-wrap"><table className="wh-detail-table"><thead><tr><th>SKU</th><th>Phân loại</th><th>Giá bán</th><th>Tồn hiện tại</th><th>Thao tác</th></tr></thead><tbody>{detailProduct.variants.map(variant => <tr key={variant.id}><td>{variant.sku}</td><td>{variant.name}</td><td>{formatVND(variant.price)}</td><td><strong>{variant.stock}</strong></td><td><div className="wh-detail-actions"><button type="button" onClick={() => { setDetailProductId(''); openOperation('IN', detailProduct); setOperationVariantId(variant.id) }}>Nhập</button><button type="button" onClick={() => { setDetailProductId(''); openOperation('OUT', detailProduct); setOperationVariantId(variant.id) }}>Xuất</button><button type="button" onClick={() => { setDetailProductId(''); openOperation('ADJUST', detailProduct); setOperationVariantId(variant.id) }}>Kiểm kê</button></div></td></tr>)}</tbody></table></div>
          {detailProduct.variants.length === 0 && <div className="wh-detail-empty">Sản phẩm chưa có SKU.</div>}
        </div>}
      </Modal>
    </div>
  )
}
