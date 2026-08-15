import { useEffect, useState } from 'react'
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  SyncOutlined,
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  PictureOutlined,
} from '@ant-design/icons'
import { Alert, Checkbox, Modal, Pagination, Popconfirm, Radio, Select, Table, Tag, message } from 'antd'
import Swal from 'sweetalert2'

import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { useAuth } from '../../contexts/authContext'
import {
  fetchProductsThunk,
  createProductThunk,
  updateProductThunk,
  deleteProductThunk,
  adjustStockThunk,
  setTab,
  setViewMode,
  setSearch,
  setPage,
  openModal,
  closeModal,
} from '../../stores/slices/productSlice'
import type { Product } from '../../types/product'
import { productApi } from '../../apis/productApi'
import { marketplaceApi } from '../../apis/marketplaceApi'
import { apiErrorMessage } from '../../apis/authApi'
import type { MarketplaceConnection } from '../../types/marketplace'
import ProductModal from './ProductModal'
import type { ProductFormSubmission, ProductMediaDraft } from './ProductModal'
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
  const { hasPermission } = useAuth()
  const { items, totalElements, loading, error, filter, selectedProduct, isModalOpen } = useAppSelector(
    (state) => state.products
  )
  const [marketplaceConnections, setMarketplaceConnections] = useState<MarketplaceConnection[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [syncModalOpen, setSyncModalOpen] = useState(false)
  const [syncScope, setSyncScope] = useState<'SELECTED' | 'ALL'>('ALL')
  const [syncAccountIds, setSyncAccountIds] = useState<string[]>([])
  const [syncing, setSyncing] = useState(false)
  const canCreateProduct = hasPermission('PRODUCT.CREATE')
  const canUpdateProduct = hasPermission('PRODUCT.UPDATE')
  const canDeleteProduct = hasPermission('PRODUCT.DELETE')
  const canManageProducts = canCreateProduct || canUpdateProduct || canDeleteProduct

  useEffect(() => {
    dispatch(fetchProductsThunk())
  }, [dispatch, filter.tab, filter.search, filter.page])

  useEffect(() => {
    marketplaceApi.list()
      .then((connections) => setMarketplaceConnections(
        connections.filter((connection) => connection.status === 'CONNECTED'),
      ))
      .catch(() => setMarketplaceConnections([]))
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      void dispatch(fetchProductsThunk())
    }, 30000)
    return () => window.clearInterval(timer)
  }, [dispatch])

  useEffect(() => {
    if (error) message.error(error)
  }, [error])

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

  const marketplaceLabels = (product: Product) => product.marketplaceAccountIds
    .map((accountId) => marketplaceConnections.find((item) => item.id === accountId))
    .filter((connection): connection is MarketplaceConnection => Boolean(connection))
    .map((connection) => `${connection.marketplaceName}: ${connection.shopName}`)

  const openSyncModal = () => {
    if (marketplaceConnections.length === 0) {
      message.warning('Tenant chưa liên kết shop TikTok hoặc Lazada đang hoạt động.')
      return
    }
    setSyncScope(selectedProductIds.length > 0 ? 'SELECTED' : 'ALL')
    setSyncAccountIds([])
    setSyncModalOpen(true)
  }

  const handleSync = async () => {
    if (syncAccountIds.length === 0) {
      message.warning('Vui lòng chọn ít nhất một shop cần đăng sản phẩm.')
      return
    }
    if (syncScope === 'SELECTED' && selectedProductIds.length === 0) {
      message.warning('Vui lòng chọn ít nhất một sản phẩm trên danh sách.')
      return
    }

    setSyncing(true)
    try {
      const result = await marketplaceApi.syncAll({
        allProducts: syncScope === 'ALL',
        productIds: syncScope === 'SELECTED' ? selectedProductIds : [],
        marketplaceAccountIds: syncAccountIds,
      })
      await dispatch(fetchProductsThunk()).unwrap()
      message.success(
        `Đã kéo về ${result.products} sản phẩm, ${result.variants} SKU; đã đẩy ${result.pushedProducts} sản phẩm, ${result.pushedVariants} SKU lên sàn.`,
      )
      const archived = result.archivedProducts + result.archivedVariants
      if (archived > 0) {
        message.info(`Đã ngừng hiển thị ${archived} sản phẩm/SKU không còn trên sàn.`)
      }
      if (result.pullFailures > 0) {
        const failedNames = result.shopResults
          .filter((shop) => shop.pullStatus === 'FAILED' || shop.pullStatus === 'PARTIAL')
          .map((shop) => shop.shopName)
        message.warning(
          `Luồng kéo dữ liệu lỗi tại: ${failedNames.join(', ')}. Luồng đẩy vẫn tiếp tục độc lập.`,
        )
      }
      if (result.pushFailures > 0) {
        const failedNames = result.shopResults
          .filter((shop) => shop.pushStatus === 'FAILED' || shop.pushStatus === 'PARTIAL')
          .map((shop) => shop.shopName)
        message.warning(
          `Luồng đăng sản phẩm lỗi hoặc chưa hoàn tất tại: ${failedNames.join(', ')}. Dữ liệu kéo về không bị hủy.`,
        )
      }
      setSelectedProductIds([])
      setSyncModalOpen(false)
    } catch (syncError) {
      message.error(apiErrorMessage(syncError))
    } finally {
      setSyncing(false)
    }
  }

  const marketplaceSyncOptions = (['TIKTOK_SHOP', 'LAZADA'] as const)
    .map((marketplace) => ({
      label: marketplace === 'TIKTOK_SHOP' ? 'TikTok Shop' : 'Lazada',
      options: marketplaceConnections
        .filter((connection) => connection.marketplace === marketplace)
        .map((connection) => ({
          value: connection.id,
          label: `${connection.shopName} (${connection.externalAccountId})`,
        })),
    }))
    .filter((group) => group.options.length > 0)

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteProductThunk(id)).unwrap()
      message.success('Đã xóa sản phẩm thành công')
    } catch {
      // Thông báo chi tiết được lấy từ ProblemDetail và hiển thị qua state.error.
    }
  }

  const syncProductMedia = async (
    productId: string,
    originalMedia: Product['media'],
    drafts: ProductMediaDraft[],
  ) => {
    const pendingFiles = drafts.filter((item) => item.file)
    const uploaded = pendingFiles.length > 0
      ? await productApi.uploadMedia(productId, pendingFiles.map((item) => item.file!))
      : []
    if (
      uploaded.length !== pendingFiles.length
      || uploaded.some((item) => !item.id || !item.storageKey || !item.publicUrl)
    ) {
      throw new Error('Cloudinary chưa xác nhận tải lên đầy đủ toàn bộ media.')
    }

    const retainedIds = new Set(
      drafts.flatMap((item) => item.existingId ? [item.existingId] : []),
    )
    await Promise.all(
      originalMedia
        .filter((item) => !retainedIds.has(item.id))
        .map((item) => productApi.deleteMedia(productId, item.id)),
    )

    let uploadIndex = 0
    const orderedMedia = drafts.map((draft) => {
      const id = draft.existingId ?? uploaded[uploadIndex++]?.id
      if (!id) throw new Error('Cloudinary không trả về mã media sau khi tải lên.')
      return { id, primary: draft.primary }
    })
    if (orderedMedia.length > 0) {
      await productApi.reorderMedia(productId, orderedMedia)
    }
  }

  const handleSaveModal = async ({ mediaDrafts, ...values }: ProductFormSubmission) => {
    let savedProduct: Product
    try {
      if (selectedProduct) {
        savedProduct = await dispatch(updateProductThunk({
          id: selectedProduct.id,
          data: { ...selectedProduct, ...values },
        })).unwrap()
      } else {
        savedProduct = await dispatch(createProductThunk(values)).unwrap()
      }
    } catch (error) {
      message.error(apiErrorMessage(error))
      throw error
    }

    try {
      await syncProductMedia(savedProduct.id, selectedProduct?.media ?? [], mediaDrafts)
      await dispatch(fetchProductsThunk()).unwrap()
      message.success(selectedProduct
        ? 'Đã cập nhật sản phẩm, biến thể và media thành công!'
        : 'Đã thêm sản phẩm, biến thể và media thành công!')
      dispatch(closeModal())
    } catch (error) {
      await dispatch(fetchProductsThunk())
      dispatch(closeModal())
      message.warning(
        `Thông tin sản phẩm đã được lưu nhưng media chưa hoàn tất: ${apiErrorMessage(error)}`,
        8,
      )
    }
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
      render: (_: string[], record: Product) => {
        const mps = marketplaceLabels(record)
        return (
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
        )
      },
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
  const visibleTableColumns = canManageProducts
    ? tableColumns
    : tableColumns.filter((column) => column.key !== 'action')

  // ---- Render card body trạng thái ----
  function renderVariantRow(prod: Product) {
    const variantText =
      prod.variants.length > 0
        ? `${prod.variants.length} bản (${prod.variants.map((v) => v.name.replace('Size ', '')).join(', ')})`
        : 'Chưa cấu hình phân loại & biến thể'

    const stockPresentation = prod.status === 'LOW_STOCK'
      ? { text: `Chỉ còn ${prod.totalStock} chiếc`, className: 'low' }
      : prod.status === 'DRAFT'
        ? { text: '', className: 'draft' }
        : { text: 'Còn hàng', className: 'ok' }

    return (
      <>
        <div className="product-variant-row">
          <span>
            <span className="variant-label">Biến thể: </span>
            <span className="variant-value">{variantText}</span>
          </span>
          {stockPresentation.text && (
            <span className={`stock-status-text ${stockPresentation.className}`}>
              {stockPresentation.text}
            </span>
          )}
        </div>
        <div className="stock-bar-track">
          <div className={`stock-bar-fill ${stockPresentation.className}`} />
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

        {canManageProducts && (
          <div className="product-header-actions">
            {canUpdateProduct && (
              <button
                id="btn-sync"
                className="btn-sync-marketplace"
                onClick={openSyncModal}
                disabled={loading || syncing}
                type="button"
              >
                <SyncOutlined spin={syncing} /> Đồng bộ Sàn
              </button>
            )}
            {canUpdateProduct && selectedProductIds.length > 0 && (
              <span className="product-selected-count">
                Đã chọn {selectedProductIds.length}
              </span>
            )}
            {canCreateProduct && (
              <button
                id="btn-add-product"
                className="btn-add-product"
                onClick={() => dispatch(openModal(null))}
                type="button"
              >
                <PlusOutlined /> Thêm sản phẩm
              </button>
            )}
          </div>
        )}
      </div>

      {!canManageProducts && (
        <Alert
          message="Chế độ chỉ xem"
          description="Tài khoản CSKH có thể xem thông tin sản phẩm nhưng không thể tạo, sửa, xóa, nhập kho hoặc đồng bộ sản phẩm."
          showIcon
          type="info"
        />
      )}

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
              {canUpdateProduct && (
                <div className="product-card-select">
                  <Checkbox
                    checked={selectedProductIds.includes(prod.id)}
                    onChange={(event) => setSelectedProductIds((current) =>
                      event.target.checked
                        ? [...new Set([...current, prod.id])]
                        : current.filter((id) => id !== prod.id))}
                  >
                    Chọn
                  </Checkbox>
                </div>
              )}
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
                {marketplaceLabels(prod).length > 0 && (
                  <MarketplaceTags marketplaces={marketplaceLabels(prod)} />
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
                {canManageProducts && (
                  <div className="product-card-actions">
                    {canUpdateProduct && (prod.status === 'LOW_STOCK' ? (
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
                              dispatch(adjustStockThunk({
                                id: prod.id,
                                delta: Number(res.value),
                                note: 'Nhập kho từ màn hình quản lý sản phẩm',
                              })).unwrap()
                                .then(() => message.success('Nhập kho thành công!'))
                                .catch(() => undefined)
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
                    ))}

                  {canDeleteProduct && (
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
                  )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ===== TABLE VIEW ===== */
        <div style={{ marginTop: 18 }}>
          <Table
            dataSource={filteredItems}
            columns={visibleTableColumns}
            rowKey="id"
            loading={loading}
            pagination={false}
            rowSelection={canUpdateProduct ? {
              preserveSelectedRowKeys: true,
              selectedRowKeys: selectedProductIds,
              onChange: (keys) => setSelectedProductIds(keys.map(String)),
            } : undefined}
            style={{ background: '#ffffff', borderRadius: 10, overflow: 'hidden' }}
          />
        </div>
      )}

      {/* ===== PAGINATION BAR ===== */}
      <div className="product-pagination-bar">
        <div>
          Hiển thị {filteredItems.length} trong số {totalElements.toLocaleString('vi-VN')} sản phẩm
        </div>
        <Pagination
          current={filter.page}
          pageSize={filter.pageSize}
          total={totalElements}
          showSizeChanger={false}
          showTotal={(total) => `${total} sản phẩm`}
          onChange={(page) => dispatch(setPage(page))}
        />
      </div>

      {/* ===== MODAL ADD / EDIT ===== */}
      {canManageProducts && (
        <ProductModal
          open={isModalOpen}
          product={selectedProduct}
          onCancel={() => dispatch(closeModal())}
          onSave={handleSaveModal}
        />
      )}

      {canUpdateProduct && <Modal
        cancelButtonProps={{ disabled: syncing }}
        cancelText="Hủy"
        confirmLoading={syncing}
        maskClosable={!syncing}
        okText="Bắt đầu đồng bộ"
        onCancel={() => setSyncModalOpen(false)}
        onOk={() => void handleSync()}
        open={syncModalOpen}
        title="Đồng bộ sản phẩm với sàn"
        width={620}
      >
        <div className="product-sync-modal">
          <div className="product-sync-field">
            <strong>1. Chọn phạm vi sản phẩm</strong>
            <Radio.Group
              onChange={(event) => setSyncScope(event.target.value)}
              value={syncScope}
            >
              <Radio disabled={selectedProductIds.length === 0} value="SELECTED">
                Các sản phẩm đã chọn ({selectedProductIds.length})
              </Radio>
              <Radio value="ALL">Tất cả sản phẩm trong kho</Radio>
            </Radio.Group>
          </div>
          <div className="product-sync-field">
            <strong>2. Chọn sàn/shop sẽ đăng lên</strong>
            <Select
              mode="multiple"
              onChange={setSyncAccountIds}
              optionFilterProp="label"
              options={marketplaceSyncOptions}
              placeholder="Chọn một sàn hoặc cả TikTok và Lazada"
              value={syncAccountIds}
            />
          </div>
          <div className="product-sync-note">
            Đồng bộ luôn kéo sản phẩm mới từ tất cả shop đã liên kết về hệ thống.
            Nếu một sản phẩm hoặc một chiều đồng bộ lỗi, các sản phẩm và chiều còn lại vẫn tiếp tục.
          </div>
        </div>
      </Modal>}
    </div>
  )
}
