import { useEffect } from 'react'
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  SyncOutlined,
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  PictureOutlined,
} from '@ant-design/icons'
import { Table, Tag, Popconfirm, message } from 'antd'
import Swal from 'sweetalert2'

import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  fetchProductsThunk,
  createProductThunk,
  updateProductThunk,
  deleteProductThunk,
  syncMarketplacesThunk,
  setTab,
  setViewMode,
  setSearch,
  setPage,
  openModal,
  closeModal,
} from '../../stores/slices/productSlice'
import type { Product } from '../../types/product'
import ProductModal from './ProductModal'
import './products.css'

// Hiển thị tối đa 2 sàn + badge "+N"
function MarketplaceTags({ marketplaces }: { marketplaces: string[] }) {
  const MAX_SHOW = 2
  const shown = marketplaces.slice(0, MAX_SHOW)
  const rest = marketplaces.length - MAX_SHOW

  return (
    <div className="card-marketplace-tags">
      {shown.map((mp) => (
        <span key={mp} className={`mp-tag ${mp.replace(/\s+/g, '-')}`}>
          {mp}
        </span>
      ))}
      {rest > 0 && <span className="mp-tag-more">+{rest}</span>}
    </div>
  )
}

export default function ProductScreen() {
  const dispatch = useAppDispatch()
  const { items, loading, filter, selectedProduct, isModalOpen } = useAppSelector(
    (state) => state.products
  )

  useEffect(() => {
    dispatch(fetchProductsThunk())
  }, [dispatch, filter.tab, filter.search, filter.page])

  // Khi backend bật: filter đã áp dụng phía server, items trả về đã được lọc
  // Khi backend tắt (mock data): filter client-side vẫn hoạt động
  const filteredItems = items.filter((item) => {
    if (filter.tab === 'ACTIVE' && item.status !== 'ACTIVE') return false
    if (
      filter.tab === 'OUT_OF_STOCK' &&
      item.status !== 'OUT_OF_STOCK' &&
      item.status !== 'LOW_STOCK'
    )
      return false
    if (filter.tab === 'DRAFT' && item.status !== 'DRAFT') return false

    if (filter.search.trim()) {
      const q = filter.search.toLowerCase()
      return (
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      )
    }
    return true
  })

  const formatVND = (num: number) => {
    if (!num) return '0đ'
    return `${num.toLocaleString('vi-VN')}đ`
  }

  const countAll = items.length
  const countActive = items.filter((i) => i.status === 'ACTIVE').length
  const countLowStock = items.filter(
    (i) => i.status === 'OUT_OF_STOCK' || i.status === 'LOW_STOCK'
  ).length
  const countDraft = items.filter((i) => i.status === 'DRAFT').length

  const handleSync = () => {
    dispatch(syncMarketplacesThunk())
    message.success('Đã gửi yêu cầu đồng bộ sản phẩm từ các sàn!')
  }

  const handleDelete = (id: string) => {
    dispatch(deleteProductThunk(id))
    message.success('Đã xóa sản phẩm thành công')
  }

  const handleSaveModal = (values: Partial<Product>) => {
    if (selectedProduct) {
      dispatch(updateProductThunk({ id: selectedProduct.id, data: values }))
      message.success('Đã cập nhật sản phẩm thành công!')
    } else {
      dispatch(createProductThunk(values))
      message.success('Đã thêm sản phẩm mới thành công!')
    }
    dispatch(closeModal())
  }

  // ---- Table columns (chế độ bảng) ----
  const tableColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (_: unknown, record: Product) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 6,
              overflow: 'hidden',
              background: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {record.imageUrl ? (
              <img
                src={record.imageUrl}
                alt={record.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <PictureOutlined style={{ color: '#d1d5db', fontSize: 22 }} />
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{record.name}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{record.category}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Mã gốc (SKU)',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <span style={{ fontWeight: 600, color: '#374151', fontSize: 12.5 }}>{code}</span>
      ),
    },
    {
      title: 'Biến thể',
      dataIndex: 'variants',
      key: 'variants',
      render: (variants: Product['variants']) =>
        variants && variants.length > 0 ? (
          <Tag color="blue">{variants.length} biến thể</Tag>
        ) : (
          <Tag color="default">Chưa có</Tag>
        ),
    },
    {
      title: 'Sàn liên kết',
      dataIndex: 'marketplaces',
      key: 'marketplaces',
      render: (mps: string[]) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {mps && mps.length > 0 ? (
            mps.map((m) => (
              <Tag
                key={m}
                color={m === 'Shopee' ? 'orange' : m === 'Lazada' ? 'geekblue' : 'volcano'}
              >
                {m}
              </Tag>
            ))
          ) : (
            <Tag color="default">Chưa nối</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Giá bán',
      dataIndex: 'price',
      key: 'price',
      render: (price: number, record: Product) => (
        <div>
          <div style={{ fontWeight: 700, color: '#111827', fontSize: 13 }}>{formatVND(price)}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>Vốn: {formatVND(record.costPrice)}</div>
        </div>
      ),
    },
    {
      title: 'Tồn kho',
      dataIndex: 'totalStock',
      key: 'totalStock',
      render: (stock: number, record: Product) => (
        <div
          style={{
            fontWeight: 700,
            color: record.status === 'LOW_STOCK' ? '#ef4444' : '#111827',
          }}
        >
          {stock} chiếc
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: Product) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-card-edit"
            onClick={() => dispatch(openModal(record))}
            type="button"
          >
            Sửa
          </button>
          <Popconfirm
            title="Xóa sản phẩm"
            description="Bạn có chắc chắn muốn xóa sản phẩm này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <button className="btn-card-delete" type="button">
              <DeleteOutlined />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ]

  // ---- Render card body trạng thái ----
  function renderVariantRow(prod: Product) {
    const variantText =
      prod.variants.length > 0
        ? `${prod.variants.length} bản (${prod.variants.map((v) => v.name.replace('Size ', '')).join(', ')})`
        : 'Chưa cấu hình phân loại & biến thể'

    let statusText = ''
    let statusClass = ''
    let barClass = ''

    if (prod.status === 'LOW_STOCK') {
      statusText = `Chỉ còn ${prod.totalStock} chiếc`
      statusClass = 'low'
      barClass = 'low'
    } else if (prod.status === 'DRAFT') {
      statusText = ''
      statusClass = 'draft'
      barClass = 'draft'
    } else {
      statusText = 'Còn hàng'
      statusClass = 'ok'
      barClass = 'ok'
    }

    return (
      <>
        <div className="product-variant-row">
          <span>
            <span className="variant-label">Biến thể: </span>
            <span className="variant-value">{variantText}</span>
          </span>
          {statusText && (
            <span className={`stock-status-text ${statusClass}`}>{statusText}</span>
          )}
        </div>
        <div className="stock-bar-track">
          <div className={`stock-bar-fill ${barClass}`} />
        </div>
      </>
    )
  }

  return (
    <div className="product-page-container">
      {/* ===== HEADER BAR ===== */}
      <div className="product-header-bar">
        <div className="product-title-group">
          <h1>Danh sách sản phẩm</h1>
          <div className="view-mode-toggle">
            <button
              id="btn-view-grid"
              className={`view-mode-btn ${filter.viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => dispatch(setViewMode('grid'))}
              type="button"
            >
              <AppstoreOutlined /> Lưới
            </button>
            <button
              id="btn-view-table"
              className={`view-mode-btn ${filter.viewMode === 'table' ? 'active' : ''}`}
              onClick={() => dispatch(setViewMode('table'))}
              type="button"
            >
              <UnorderedListOutlined /> Bảng
            </button>
          </div>
        </div>

        <div className="product-header-actions">
          <button
            id="btn-sync"
            className="btn-sync-marketplace"
            onClick={handleSync}
            type="button"
          >
            <SyncOutlined spin={loading} /> Đồng bộ Sàn
          </button>
          <button
            id="btn-add-product"
            className="btn-add-product"
            onClick={() => dispatch(openModal(null))}
            type="button"
          >
            <PlusOutlined /> Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="product-filter-bar">
        <div className="product-status-tabs">
          <button
            id="tab-all"
            className={`status-tab-btn ${filter.tab === 'ALL' ? 'active' : ''}`}
            onClick={() => dispatch(setTab('ALL'))}
            type="button"
          >
            Tất cả sản phẩm ({countAll.toLocaleString('vi-VN')})
          </button>
          <button
            id="tab-active"
            className={`status-tab-btn ${filter.tab === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => dispatch(setTab('ACTIVE'))}
            type="button"
          >
            Đang bán ({countActive.toLocaleString('vi-VN')})
          </button>
          <button
            id="tab-out-of-stock"
            className={`status-tab-btn ${filter.tab === 'OUT_OF_STOCK' ? 'active' : ''}`}
            onClick={() => dispatch(setTab('OUT_OF_STOCK'))}
            type="button"
          >
            Hết hàng ({countLowStock})
          </button>
          <button
            id="tab-draft"
            className={`status-tab-btn ${
              filter.tab === 'DRAFT' ? 'active-warn' : ''
            }`}
            onClick={() => dispatch(setTab('DRAFT'))}
            type="button"
          >
            Nháp / Đợi duyệt ({countDraft})
          </button>
        </div>

        <div className="search-box-container">
          <input
            id="product-search-input"
            className="search-input"
            placeholder="Tìm tên, mã vạch, SKU..."
            value={filter.search}
            onChange={(e) => dispatch(setSearch(e.target.value))}
          />
          <SearchOutlined className="search-icon" />
        </div>
      </div>

      {/* ===== CONTENT AREA ===== */}
      {filter.viewMode === 'grid' ? (
        <div className="product-grid-container">
          {filteredItems.map((prod) => (
            <div
              key={prod.id}
              className={`product-card ${prod.status === 'DRAFT' ? 'is-draft' : ''}`}
            >
              {/* --- Card Image Section --- */}
              <div
                className={`product-card-media ${!prod.imageUrl ? 'no-image' : ''}`}
              >
                {/* Badge HOT / SẮP CHÁY HÀNG */}
                {prod.badgeText && prod.status !== 'DRAFT' && (
                  <span className={`card-top-badge ${prod.badgeType || 'hot'}`}>
                    {prod.badgeText}
                  </span>
                )}

                {/* Draft overlay label */}
                {prod.status === 'DRAFT' && (
                  <span className="draft-label-overlay">
                    BẢN NHÁP / CHƯA HOẠT ĐỘNG
                  </span>
                )}

                {/* Product image or placeholder */}
                {prod.imageUrl ? (
                  <img src={prod.imageUrl} alt={prod.name} />
                ) : (
                  <div className="placeholder-img-wrapper">
                    <PictureOutlined />
                  </div>
                )}

                {/* Marketplace badges — only show if not draft */}
                {prod.marketplaces.length > 0 && (
                  <MarketplaceTags marketplaces={prod.marketplaces} />
                )}
              </div>

              {/* --- Card Body --- */}
              <div className="product-card-body">
                {/* Category */}
                <div className="product-category">{prod.category}</div>

                {/* Product name */}
                <div className="product-name" title={prod.name}>
                  {prod.name}
                </div>

                {/* SKU + codes */}
                <div className="product-sku-line">
                  Mã gốc: {prod.code}
                  {prod.variants.length > 0 && (
                    <> · {prod.variants.map((v) => v.sku).join(', ')}</>
                  )}
                </div>

                {/* Variant row + stock bar */}
                {renderVariantRow(prod)}

                {/* Price + stock */}
                <div className="product-price-stock">
                  <div className="price-block">
                    <div className="price-main">{formatVND(prod.price)}</div>
                    {prod.costPrice > 0 && (
                      <div className="price-cost">Vốn: {formatVND(prod.costPrice)}</div>
                    )}
                    {prod.price === 0 && prod.status === 'DRAFT' && (
                      <div className="price-cost" style={{ color: '#d1d5db' }}>Đ</div>
                    )}
                  </div>
                  <div className="stock-block">
                    <div
                      className={`stock-qty ${prod.status === 'LOW_STOCK' ? 'low-qty' : ''}`}
                    >
                      {prod.totalStock}
                      <span>chiếc</span>
                    </div>
                    <div className="stock-label">Tổng tồn kho</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="product-card-actions">
                  {prod.status === 'LOW_STOCK' ? (
                    <button
                      className="btn-card-restock"
                      onClick={() => {
                        Swal.fire({
                          title: 'Nhập kho',
                          text: `Nhập thêm số lượng cho: ${prod.name}`,
                          input: 'number',
                          inputValue: 50,
                          showCancelButton: true,
                          confirmButtonText: 'Xác nhận nhập',
                          cancelButtonText: 'Hủy',
                        }).then((res) => {
                          if (res.isConfirmed && res.value) {
                            dispatch(
                              updateProductThunk({
                                id: prod.id,
                                data: {
                                  totalStock: prod.totalStock + Number(res.value),
                                  status: 'ACTIVE',
                                  badgeText: undefined,
                                },
                              })
                            )
                            message.success('Nhập kho thành công!')
                          }
                        })
                      }}
                      type="button"
                    >
                      Nhập kho ngay
                    </button>
                  ) : prod.status === 'DRAFT' ? (
                    <button
                      className="btn-card-configure"
                      onClick={() => dispatch(openModal(prod))}
                      type="button"
                    >
                      Cấu hình tiếp
                    </button>
                  ) : (
                    <button
                      className="btn-card-edit"
                      onClick={() => dispatch(openModal(prod))}
                      type="button"
                    >
                      Sửa thông tin
                    </button>
                  )}

                  <Popconfirm
                    title="Xóa sản phẩm"
                    description="Bạn có chắc chắn muốn xóa sản phẩm này?"
                    onConfirm={() => handleDelete(prod.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                  >
                    <button className="btn-card-delete" type="button" title="Xóa sản phẩm">
                      <DeleteOutlined />
                    </button>
                  </Popconfirm>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ===== TABLE VIEW ===== */
        <div style={{ marginTop: 18 }}>
          <Table
            dataSource={filteredItems}
            columns={tableColumns}
            rowKey="id"
            loading={loading}
            pagination={false}
            style={{ background: '#ffffff', borderRadius: 10, overflow: 'hidden' }}
          />
        </div>
      )}

      {/* ===== PAGINATION BAR ===== */}
      <div className="product-pagination-bar">
        <div>
          Hiển thị 1–{filteredItems.length} trong số {items.length.toLocaleString('vi-VN')} sản phẩm
        </div>
        <div className="pagination-controls">
          <button
            className="page-btn"
            disabled={filter.page <= 1}
            onClick={() => dispatch(setPage(filter.page - 1))}
            type="button"
          >
            ‹
          </button>
          <button className="page-btn active" type="button">1</button>
          <button className="page-btn" type="button">2</button>
          <button className="page-btn" type="button">3</button>
          <button
            className="page-btn"
            onClick={() => dispatch(setPage(filter.page + 1))}
            type="button"
          >
            ›
          </button>
        </div>
      </div>

      {/* ===== MODAL ADD / EDIT ===== */}
      <ProductModal
        open={isModalOpen}
        product={selectedProduct}
        onCancel={() => dispatch(closeModal())}
        onSave={handleSaveModal}
      />
    </div>
  )
}
