import { useEffect, useMemo, useState } from 'react'
import {
  SearchOutlined,
  FileExcelOutlined,
  PlusOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  DollarOutlined,
  PictureOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import { productApi } from '../../apis/productApi'
import './warehouse.css'

type WhStockStatus = 'LOW' | 'NORMAL' | 'OVERSTOCK'

interface WhProduct {
  id: string
  name: string
  skus: string[]       // danh sách mã SKU biến thể
  category: string     // e.g. "Áo khoác / Outerwear"
  costPrice: number    // giá vốn nhập
  quantity: number     // tổng tồn kho
  minStock: number     // ngưỡng cảnh báo hết
  maxStock: number     // ngưỡng cảnh báo vượt mức
  imageUrl?: string
  daysInStock?: number // số ngày tồn kho (cho cảnh báo lâu)
}

function getStockStatus(p: WhProduct): WhStockStatus {
  if (p.quantity <= p.minStock) return 'LOW'
  if (p.quantity >= p.maxStock) return 'OVERSTOCK'
  return 'NORMAL'
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function WarehouseScreen() {
  const [products, setProducts] = useState<WhProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortMode, setSortMode] = useState<'qty_desc' | 'updated'>('qty_desc')

  useEffect(() => {
    let active = true
    productApi.fetchProducts('', '', 0, 200)
      .then(items => {
        if (!active) return
        const now = Date.now()
        setProducts(items.map(product => {
          const minStock = product.minStockAlert ?? 5
          const createdAt = product.createdAt ? new Date(product.createdAt).getTime() : now
          return {
            id: product.id,
            name: product.name,
            skus: product.variants.map(variant => variant.sku),
            category: product.category || 'Chưa phân loại',
            costPrice: product.costPrice,
            quantity: product.totalStock,
            minStock,
            maxStock: Math.max(100, minStock * 10),
            imageUrl: product.imageUrl,
            daysInStock: Math.max(0, Math.floor((now - createdAt) / 86_400_000)),
          }
        }))
        setLoadError('')
      })
      .catch(() => {
        if (active) setLoadError('Không thể tải dữ liệu kho hàng')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const formatVND = (n: number) => `${n.toLocaleString('vi-VN')}đ`

  // Summary stats
  const lowStockItems  = products.filter(p => getStockStatus(p) === 'LOW')
  const slowMoving     = products.filter(p => (p.daysInStock ?? 0) > 90)
  const totalValue     = products.reduce((acc, p) => acc + p.costPrice * p.quantity, 0)
  const totalSkuCount  = products.reduce((acc, p) => acc + p.skus.length, 0)

  const formatValue = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
    if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`
    return formatVND(n)
  }

  // Unique categories
  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))]

  // Filtered + sorted
  const displayed = useMemo(() => {
    let list = [...products]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.skus.some(s => s.toLowerCase().includes(q))
      )
    }
    if (categoryFilter !== 'ALL') {
      list = list.filter(p => p.category === categoryFilter)
    }
    if (statusFilter === 'LOW')       list = list.filter(p => getStockStatus(p) === 'LOW')
    if (statusFilter === 'NORMAL')    list = list.filter(p => getStockStatus(p) === 'NORMAL')
    if (statusFilter === 'OVERSTOCK') list = list.filter(p => getStockStatus(p) === 'OVERSTOCK')

    if (sortMode === 'qty_desc') list.sort((a, b) => b.quantity - a.quantity)
    // 'updated' — giữ thứ tự gốc

    return list
  }, [products, search, categoryFilter, statusFilter, sortMode])

  return (
    <div className="wh-page">

      {/* ===== HEADER ===== */}
      <div className="wh-header">
        <div className="wh-header-left">
          <h1>Quản lý kho hàng</h1>
          <span className="wh-updated-badge">Cập nhật: Vừa xong</span>
        </div>
        <div className="wh-header-actions">
          <button className="btn-export-excel" type="button">
            <FileExcelOutlined /> Xuất Excel
          </button>
          <button className="btn-import-stock" type="button">
            <PlusOutlined /> Nhập kho mới
          </button>
        </div>
      </div>

      {/* ===== STAT CARDS ===== */}
      <div className="wh-stats-grid">

        {/* Card 1: Sắp hết hàng */}
        <div className="wh-stat-card">
          <div className="wh-stat-label red">Sắp hết hàng ({'<'}5 sản phẩm)</div>
          <div className="wh-stat-number-row">
            <span className="wh-stat-number red">{String(lowStockItems.length).padStart(2, '0')}</span>
            <span className="wh-stat-unit">Mã hàng</span>
          </div>
          <div className="wh-stat-desc">Cần bổ sung gấp trong 24h kế</div>
          <div className="wh-stat-icon red"><WarningOutlined /></div>
        </div>

        {/* Card 2: Tồn kho lâu */}
        <div className="wh-stat-card">
          <div className="wh-stat-label orange">Tồn kho lâu ({'>'} 90 ngày)</div>
          <div className="wh-stat-number-row">
            <span className="wh-stat-number orange">{slowMoving.reduce((acc, p) => acc + p.quantity, 0)}</span>
            <span className="wh-stat-unit">Đơn vị</span>
          </div>
          <div className="wh-stat-desc">Gợi ý tạo chiến dịch Khuyến mãi</div>
          <div className="wh-stat-icon orange"><ClockCircleOutlined /></div>
        </div>

        {/* Card 3: Tổng phẩm loại */}
        <div className="wh-stat-card">
          <div className="wh-stat-label blue">Tổng phẩm loại hoạt động</div>
          <div className="wh-stat-number-row">
            <span className="wh-stat-number blue">{totalSkuCount.toLocaleString('vi-VN')}</span>
            <span className="wh-stat-unit">SKU</span>
          </div>
          <div className="wh-stat-desc">Đồng bộ theo danh mục sản phẩm hiện tại</div>
          <div className="wh-stat-icon blue"><DatabaseOutlined /></div>
        </div>

        {/* Card 4: Giá trị tổng kho */}
        <div className="wh-stat-card">
          <div className="wh-stat-label teal">Giá trị tổng kho hàng</div>
          <div className="wh-stat-number-row">
            <span className="wh-stat-number teal">{formatValue(totalValue)}</span>
            <span className="wh-stat-unit">VNĐ</span>
          </div>
          <div className="wh-stat-desc">Tính theo giá vốn nhập kho</div>
          <div className="wh-stat-icon teal"><DollarOutlined /></div>
        </div>

      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="wh-filter-bar">
        <div className="wh-search-wrap">
          <SearchOutlined className="wh-search-icon" />
          <input
            className="wh-search-input"
            placeholder="Tìm kiếm tên sản phẩm, mã SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="wh-filter-select"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          {categories.map(c => (
            <option key={c} value={c}>{c === 'ALL' ? 'Tất cả danh mục' : c}</option>
          ))}
        </select>

        <select
          className="wh-filter-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="ALL">Trạng thái: Tất cả</option>
          <option value="LOW">Sắp hết hàng</option>
          <option value="NORMAL">Còn hàng an toàn</option>
          <option value="OVERSTOCK">Tồn kho vượt mức</option>
        </select>

        <div className="wh-sort-group">
          <span className="wh-sort-label">Sắp xếp:</span>
          <button
            className={`btn-sort ${sortMode === 'qty_desc' ? 'active' : ''}`}
            onClick={() => setSortMode('qty_desc')}
            type="button"
          >
            Tồn kho giảm dần
          </button>
          <button
            className={`btn-sort ${sortMode === 'updated' ? 'active' : ''}`}
            onClick={() => setSortMode('updated')}
            type="button"
          >
            Mới cập nhật
          </button>
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <div className="wh-table-container">
        <table className="wh-table">
          <colgroup>
            <col className="col-img" />
            <col className="col-info" />
            <col className="col-cat" />
            <col className="col-price" />
            <col className="col-qty" />
            <col className="col-status" />
            <col className="col-action" />
          </colgroup>
          <thead>
            <tr>
              <th>ẢNH</th>
              <th>THÔNG TIN SẢN PHẨM / SKU</th>
              <th>DANH MỤC</th>
              <th>GIÁ VỐN NHẬP</th>
              <th>SỐ LƯỢNG TỒN</th>
              <th>TRẠNG THÁI KHO</th>
              <th>HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                  Đang tải dữ liệu kho hàng...
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#dc2626' }}>
                  {loadError}
                </td>
              </tr>
            ) : displayed.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                  Không tìm thấy sản phẩm nào
                </td>
              </tr>
            ) : (
              displayed.map(prod => {
                const status = getStockStatus(prod)

                const qtyClass =
                  status === 'LOW' ? 'low' :
                  status === 'OVERSTOCK' ? 'overstock' : 'normal'

                const statusBadge =
                  status === 'LOW'       ? <span className="wh-status-badge chayhang">🔴 CHÁY HÀNG ĐẾN NƠI</span> :
                  status === 'OVERSTOCK' ? <span className="wh-status-badge vuotmuc">🟡 TỒN KHO VƯỢT MỨC</span> :
                                           <span className="wh-status-badge antoan">🟢 CÒN HÀNG AN TOÀN</span>

                const actionBtn =
                  status === 'LOW'
                    ? <button className="btn-nhap-hang" type="button">Nhập hàng</button>
                    : status === 'OVERSTOCK'
                    ? <button className="btn-xa-hang" type="button">Xả hàng</button>
                    : <button className="btn-wh-action" type="button" title="Chi tiết"><MoreOutlined /></button>

                const qtySubtext =
                  status === 'LOW'
                    ? `Mức an toàn: ${prod.minStock}`
                    : status === 'OVERSTOCK'
                    ? `Tối đa: ${prod.maxStock} đơn vị`
                    : `Mức an toàn: +${prod.quantity - prod.minStock}`

                return (
                  <tr key={prod.id}>
                    {/* Ảnh */}
                    <td>
                      {prod.imageUrl ? (
                        <div className="wh-product-thumb">
                          <img src={prod.imageUrl} alt={prod.name} />
                        </div>
                      ) : (
                        <div className="wh-product-thumb-placeholder">
                          <PictureOutlined />
                        </div>
                      )}
                    </td>

                    {/* Thông tin sản phẩm / SKU */}
                    <td>
                      <div className="wh-prod-name" title={prod.name}>{prod.name}</div>
                      <div className="wh-prod-skus">SKU: {prod.skus.join(' · ')}</div>
                    </td>

                    {/* Danh mục */}
                    <td>
                      <span className="wh-cat-text">{prod.category}</span>
                    </td>

                    {/* Giá vốn nhập */}
                    <td>
                      <span className="wh-price">{formatVND(prod.costPrice)}</span>
                    </td>

                    {/* Số lượng tồn */}
                    <td>
                      <div className={`wh-qty-number ${qtyClass}`}>
                        {String(prod.quantity).padStart(2, '0')}
                      </div>
                      <div className="wh-qty-sub">{qtySubtext}</div>
                      <div className="wh-qty-bar">
                        <div className={`wh-qty-bar-fill ${qtyClass}`} />
                      </div>
                    </td>

                    {/* Trạng thái kho */}
                    <td>{statusBadge}</td>

                    {/* Hành động */}
                    <td>{actionBtn}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="wh-pagination-bar">
          <div>
            Hiển thị {displayed.length === 0 ? 0 : 1}–{displayed.length} trong số {totalSkuCount.toLocaleString('vi-VN')} SKU hàng hóa
          </div>
          <div className="wh-pagination-controls">
            <button className="wh-page-btn" disabled type="button">‹</button>
            <button className="wh-page-btn active" type="button">1</button>
            <button className="wh-page-btn" type="button">2</button>
            <button className="wh-page-btn" type="button">3</button>
            <button className="wh-page-btn" type="button">›</button>
          </div>
        </div>
      </div>

    </div>
  )
}
