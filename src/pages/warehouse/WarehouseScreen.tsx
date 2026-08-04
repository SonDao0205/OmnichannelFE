import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ClockCircleOutlined,
  DatabaseOutlined,
  DollarOutlined,
  FileExcelOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { InputNumber, Modal, Select } from 'antd'
import { toast } from 'react-toastify'

import { apiErrorMessage } from '../../apis/authApi'
import { productApi } from '../../apis/productApi'
import type { Product } from '../../types/product'
import './warehouse.css'

type StockStatus = 'LOW' | 'NORMAL'

function stockStatus(product: Product): StockStatus {
  return product.totalStock <= product.minStockAlert ? 'LOW' : 'NORMAL'
}

function daysSince(value?: string) {
  if (!value) return 0
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp)
    ? Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000))
    : 0
}

export default function WarehouseScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | StockStatus>('ALL')
  const [sortMode, setSortMode] = useState<'qty_desc' | 'updated'>('qty_desc')
  const [restockProduct, setRestockProduct] = useState<Product | null>(null)
  const [restockVariantId, setRestockVariantId] = useState('')
  const [restockQuantity, setRestockQuantity] = useState<number | null>(1)
  const [restocking, setRestocking] = useState(false)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await productApi.fetchAllProducts()
      setProducts(data)
      setLastUpdatedAt(new Date())
    } catch (error) {
      toast.error(apiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadProducts(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadProducts])

  const lowStockItems = products.filter((product) => stockStatus(product) === 'LOW')
  const slowMoving = products.filter((product) => daysSince(product.updatedAt ?? product.createdAt) > 90)
  const totalValue = products.reduce(
    (total, product) => total + product.costPrice * product.totalStock,
    0,
  )
  const totalSku = products.reduce((total, product) => total + product.variants.length, 0)

  const categories = useMemo(
    () => ['ALL', ...Array.from(new Set(products.map((product) => product.category).filter(Boolean)))],
    [products],
  )

  const displayed = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const result = products.filter((product) => {
      const matchesKeyword = !keyword
        || product.name.toLowerCase().includes(keyword)
        || product.code.toLowerCase().includes(keyword)
        || product.variants.some((variant) => variant.sku.toLowerCase().includes(keyword))
      const matchesCategory = categoryFilter === 'ALL' || product.category === categoryFilter
      const matchesStatus = statusFilter === 'ALL' || stockStatus(product) === statusFilter
      return matchesKeyword && matchesCategory && matchesStatus
    })

    return result.sort((left, right) => {
      if (sortMode === 'qty_desc') return right.totalStock - left.totalStock
      return new Date(right.updatedAt ?? right.createdAt ?? 0).getTime()
        - new Date(left.updatedAt ?? left.createdAt ?? 0).getTime()
    })
  }, [categoryFilter, products, search, sortMode, statusFilter])

  const handleRestock = (product: Product) => {
    if (product.variants.length === 0) {
      toast.warning('Sản phẩm chưa có biến thể để nhập kho.')
      return
    }
    setRestockProduct(product)
    setRestockVariantId(product.variants[0].id)
    setRestockQuantity(1)
  }

  const submitRestock = async () => {
    if (!restockProduct || !restockVariantId) return
    if (!Number.isInteger(restockQuantity) || Number(restockQuantity) <= 0) {
      toast.warning('Số lượng phải là số nguyên lớn hơn 0.')
      return
    }
    setRestocking(true)
    try {
      await productApi.adjustStock(
        restockProduct.id,
        Number(restockQuantity),
        'Nhập kho từ màn hình quản lý kho',
        restockVariantId,
      )
      toast.success('Nhập kho thành công.')
      setRestockProduct(null)
      await loadProducts()
    } catch (error) {
      toast.error(apiErrorMessage(error))
    } finally {
      setRestocking(false)
    }
  }

  const exportCsv = () => {
    const rows = [
      ['Mã sản phẩm', 'Tên sản phẩm', 'SKU', 'Danh mục', 'Giá vốn', 'Tổng tồn'],
      ...displayed.map((product) => [
        product.code,
        product.name,
        product.variants.map((variant) => variant.sku).join(' | '),
        product.category,
        String(product.costPrice),
        String(product.totalStock),
      ]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `ton-kho-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const formatVnd = (value: number) => `${value.toLocaleString('vi-VN')}đ`
  const formatValue = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    return formatVnd(value)
  }

  return (
    <div className="wh-page">
      <div className="wh-header">
        <div className="wh-header-left">
          <h1>Quản lý kho hàng</h1>
          <span className="wh-updated-badge">
            {lastUpdatedAt ? `Cập nhật: ${lastUpdatedAt.toLocaleTimeString('vi-VN')}` : 'Đang tải dữ liệu'}
          </span>
        </div>
        <div className="wh-header-actions">
          <button className="btn-export-excel" disabled={loading} onClick={exportCsv} type="button">
            <FileExcelOutlined /> Xuất CSV
          </button>
          <button className="btn-import-stock" disabled={loading} onClick={() => void loadProducts()} type="button">
            <ReloadOutlined spin={loading} /> Làm mới dữ liệu
          </button>
        </div>
      </div>

      <div className="wh-stats-grid">
        <div className="wh-stat-card">
          <div className="wh-stat-label red">Chạm ngưỡng tồn kho tối thiểu</div>
          <div className="wh-stat-number-row"><span className="wh-stat-number red">{lowStockItems.length}</span><span className="wh-stat-unit">Sản phẩm</span></div>
          <div className="wh-stat-desc">Tính theo ngưỡng cấu hình của sản phẩm</div>
          <div className="wh-stat-icon red"><WarningOutlined /></div>
        </div>
        <div className="wh-stat-card">
          <div className="wh-stat-label orange">Chưa cập nhật ({'>'} 90 ngày)</div>
          <div className="wh-stat-number-row"><span className="wh-stat-number orange">{slowMoving.length}</span><span className="wh-stat-unit">Sản phẩm</span></div>
          <div className="wh-stat-desc">Cần kiểm kê lại tồn kho thực tế</div>
          <div className="wh-stat-icon orange"><ClockCircleOutlined /></div>
        </div>
        <div className="wh-stat-card">
          <div className="wh-stat-label blue">Tổng phẩm loại hoạt động</div>
          <div className="wh-stat-number-row"><span className="wh-stat-number blue">{totalSku.toLocaleString('vi-VN')}</span><span className="wh-stat-unit">SKU</span></div>
          <div className="wh-stat-desc">Dữ liệu trực tiếp từ API sản phẩm</div>
          <div className="wh-stat-icon blue"><DatabaseOutlined /></div>
        </div>
        <div className="wh-stat-card">
          <div className="wh-stat-label teal">Giá trị tổng kho hàng</div>
          <div className="wh-stat-number-row"><span className="wh-stat-number teal">{formatValue(totalValue)}</span><span className="wh-stat-unit">VNĐ</span></div>
          <div className="wh-stat-desc">Giá vốn × số lượng tồn</div>
          <div className="wh-stat-icon teal"><DollarOutlined /></div>
        </div>
      </div>

      <div className="wh-filter-bar">
        <div className="wh-search-wrap"><SearchOutlined className="wh-search-icon" /><input className="wh-search-input" placeholder="Tìm tên sản phẩm, mã SKU..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <select className="wh-filter-select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          {categories.map((category) => <option key={category} value={category}>{category === 'ALL' ? 'Tất cả danh mục' : category}</option>)}
        </select>
        <select className="wh-filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ALL' | StockStatus)}>
          <option value="ALL">Trạng thái: Tất cả</option><option value="LOW">Sắp hết hàng</option><option value="NORMAL">Còn hàng an toàn</option>
        </select>
        <div className="wh-sort-group"><span className="wh-sort-label">Sắp xếp:</span><button className={`btn-sort ${sortMode === 'qty_desc' ? 'active' : ''}`} onClick={() => setSortMode('qty_desc')} type="button">Tồn kho giảm dần</button><button className={`btn-sort ${sortMode === 'updated' ? 'active' : ''}`} onClick={() => setSortMode('updated')} type="button">Mới cập nhật</button></div>
      </div>

      <div className="wh-table-container">
        <table className="wh-table">
          <colgroup><col className="col-img" /><col className="col-info" /><col className="col-cat" /><col className="col-price" /><col className="col-qty" /><col className="col-status" /><col className="col-action" /></colgroup>
          <thead><tr><th>ẢNH</th><th>THÔNG TIN SẢN PHẨM / SKU</th><th>DANH MỤC</th><th>GIÁ VỐN NHẬP</th><th>SỐ LƯỢNG TỒN</th><th>TRẠNG THÁI KHO</th><th>HÀNH ĐỘNG</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu kho từ hệ thống...</td></tr> : displayed.length === 0 ? <tr><td colSpan={7} style={{ color: '#9ca3af', padding: 40, textAlign: 'center' }}>Không có sản phẩm phù hợp</td></tr> : displayed.map((product) => {
              const status = stockStatus(product)
              const statusClass = status === 'LOW' ? 'low' : 'normal'
              return <tr key={product.id}>
                <td>{product.imageUrl ? <div className="wh-product-thumb"><img alt={product.name} src={product.imageUrl} /></div> : <div className="wh-product-thumb-placeholder"><PictureOutlined /></div>}</td>
                <td><div className="wh-prod-name" title={product.name}>{product.name}</div><div className="wh-prod-skus">SKU: {product.variants.map((variant) => variant.sku).join(' · ') || 'Chưa có biến thể'}</div></td>
                <td><span className="wh-cat-text">{product.category || 'Chưa phân loại'}</span></td>
                <td><span className="wh-price">{formatVnd(product.costPrice)}</span></td>
                <td><div className={`wh-qty-number ${statusClass}`}>{product.totalStock}</div><div className="wh-qty-sub">Mức tối thiểu: {product.minStockAlert}</div><div className="wh-qty-bar"><div className={`wh-qty-bar-fill ${statusClass}`} /></div></td>
                <td>{status === 'LOW' ? <span className="wh-status-badge chayhang">🔴 SẮP HẾT HÀNG</span> : <span className="wh-status-badge antoan">🟢 CÒN HÀNG AN TOÀN</span>}</td>
                <td><button className={status === 'LOW' ? 'btn-nhap-hang' : 'btn-wh-action'} onClick={() => handleRestock(product)} type="button"><PlusOutlined /> Nhập hàng</button></td>
              </tr>
            })}
          </tbody>
        </table>
        <div className="wh-pagination-bar"><div>Hiển thị {displayed.length} sản phẩm, tổng cộng {totalSku.toLocaleString('vi-VN')} SKU</div></div>
      </div>

      <Modal
        cancelButtonProps={{ disabled: restocking }}
        cancelText="Hủy"
        confirmLoading={restocking}
        maskClosable={!restocking}
        okText="Xác nhận nhập"
        onCancel={() => setRestockProduct(null)}
        onOk={() => void submitRestock()}
        open={Boolean(restockProduct)}
        title={`Nhập hàng${restockProduct ? `: ${restockProduct.name}` : ''}`}
        width={560}
      >
        <div className="wh-restock-form">
          <label>
            <span>Biến thể</span>
            <Select
              onChange={setRestockVariantId}
              options={(restockProduct?.variants ?? []).map((variant) => ({
                value: variant.id,
                label: `${variant.name} — ${variant.sku} (tồn ${variant.stock})`,
              }))}
              value={restockVariantId || undefined}
            />
          </label>
          <label>
            <span>Số lượng nhập thêm</span>
            <InputNumber
              min={1}
              onChange={setRestockQuantity}
              precision={0}
              value={restockQuantity}
            />
          </label>
        </div>
      </Modal>
    </div>
  )
}
