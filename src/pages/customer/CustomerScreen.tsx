import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  WarningOutlined,
  SyncOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { AxiosError } from 'axios'
import { Pagination } from 'antd'
import type { ApiProblem } from '../../types/auth'
import {
  customerApi,
  customerErrorMessage,
  type Customer,
  type CustomerDetail,
  type CustomerInteraction,
} from '../../apis/customerApi'
import './customer.css'

export default function CustomerScreen() {
  // Page and list state
  const [customers, setCustomers] = useState<Customer[]>([])
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'ALL' | 'VIP' | 'LOYAL' | 'NEW' | 'CHURN'>('ALL')
  const [loading, setLoading] = useState(false)

  // CDP Detail Drawer state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [detail, setDetail] = useState<CustomerDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [activeDetailTab, setActiveDetailTab] = useState<'profile' | 'channels' | 'timeline'>('profile')
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([])
  const [duplicates, setDuplicates] = useState<Customer[]>([])

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isMergeOpen, setIsMergeOpen] = useState(false)

  // Form states
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Helper to map and apply backend validation errors directly onto custom form fields
  const applyBackendFormErrors = (error: unknown, setErrorState: (errors: any) => void): boolean => {
    console.log('applyBackendFormErrors error:', error)
    if (error instanceof AxiosError) {
      const problem = error.response?.data as ApiProblem | undefined
      console.log('applyBackendFormErrors API problem body:', problem)
      const fieldErrors: Record<string, string> = {}

      // Map specific backend duplicate errors directly to their inputs
      if (problem?.code === 'PHONE_ALREADY_EXISTS') {
        fieldErrors.phoneNumber = problem.detail || 'Số điện thoại đã tồn tại ở khách hàng khác.'
        setErrorState(fieldErrors)
        return true
      }
      if (problem?.code === 'EMAIL_ALREADY_EXISTS') {
        fieldErrors.email = problem.detail || 'Email đã tồn tại ở khách hàng khác.'
        setErrorState(fieldErrors)
        return true
      }

      if (problem?.fieldErrors && typeof problem.fieldErrors === 'object') {
        for (const [key, value] of Object.entries(problem.fieldErrors)) {
          fieldErrors[key] = value as string
        }
        setErrorState(fieldErrors)
        return true
      } else if (problem?.detail) {
        fieldErrors.general = problem.detail
        setErrorState(fieldErrors)
        return true
      }
    }
    return false
  }

  // Merge choice states
  const [mergeSource, setMergeSource] = useState<Customer | null>(null)
  const [selectedMergeName, setSelectedMergeName] = useState('')
  const [selectedMergePhone, setSelectedMergePhone] = useState('')
  const [selectedMergeEmail, setSelectedMergeEmail] = useState('')

  // Statistics counters
  const [stats, setStats] = useState({
    total: 0,
    vip: 0,
    loyal: 0,
    new: 0,
    churn: 0,
  })

  // Fetch customer list
  const fetchCustomers = async (currentPage = page) => {
    setLoading(true)
    try {
      // Map activeTab to a mock or system search filter if required,
      // or pass status values. For this implementation:
      // - ALL -> identityStatus is VERIFIED or UNVERIFIED (we handle pagination dynamically)
      // - VIP / LOYAL / CHURN / NEW are client-side tags based on orders & spend.
      // To sync with backend:
      let apiStatus = statusFilter
      if (activeTab === 'CHURN') {
        // Just mock filter mapping or pass statusFilter
      }

      const data = await customerApi.getCustomerList({
        search,
        status: apiStatus || undefined,
        page: currentPage,
        size: 10,
      })

      setCustomers(data.content)
      setTotalElements(data.totalElements)

      // Calculate statistics dynamically for CRM demo KPI alignment
      const allData = await customerApi.getCustomerList({ page: 0, size: 200 })
      const list = allData.content
      const vipCount = list.filter(c => (c.totalSpend || 0) >= 20000000 || (c.totalOrders || 0) >= 25).length
      const loyalCount = list.filter(c => (c.totalSpend || 0) >= 5000000 && (c.totalSpend || 0) < 20000000).length
      const churnCount = list.filter(c => (c.totalSpend || 0) > 0 && (c.totalSpend || 0) < 1000000).length
      const newCount = list.filter(c => {
        const days = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        return days <= 14
      }).length

      setStats({
        total: data.totalElements,
        vip: vipCount,
        loyal: loyalCount,
        new: newCount,
        churn: churnCount,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers(0)
    setPage(0)
  }, [search, statusFilter, activeTab])

  // Fetch CDP profile details when selected
  const fetchDetail = async (id: string) => {
    setDetailLoading(true)
    try {
      const data = await customerApi.getCustomerDetail(id)
      setDetail(data)

      // Load duplicates
      if (data.identityStatus !== 'MERGED') {
        const dups = await customerApi.getPotentialDuplicates(id)
        setDuplicates(dups)
      } else {
        setDuplicates([])
      }

      // Load interactions timeline
      const timelineData = await customerApi.getInteractions(id)
      setInteractions(timelineData)
    } catch (err) {
      Swal.fire({
        title: 'Lỗi tải hồ sơ',
        text: customerErrorMessage(err),
        icon: 'error',
        background: '#10192b',
        color: '#fff',
      })
      setSelectedCustomerId(null)
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    if (selectedCustomerId) {
      fetchDetail(selectedCustomerId)
    } else {
      setDetail(null)
      setDuplicates([])
      setInteractions([])
    }
  }, [selectedCustomerId])

  // Create profile handler
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      await customerApi.createCustomer({
        displayName: formName.trim(),
        phoneNumber: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
      })
      setIsCreateOpen(false)
      // Reset form
      setFormName('')
      setFormPhone('')
      setFormEmail('')
      setErrors({})
      fetchCustomers()
      Swal.fire({
        title: 'Thành công',
        text: 'Hồ sơ khách hàng mới đã được khởi tạo.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: '#10192b',
        color: '#fff',
      })
    } catch (err) {
      const applied = applyBackendFormErrors(err, setErrors)
      if (!applied) {
        setErrors({ general: customerErrorMessage(err) })
      }
    }
  }

  // Update profile handler
  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    if (!selectedCustomerId) return

    try {
      await customerApi.updateCustomer(selectedCustomerId, {
        displayName: formName.trim(),
        phoneNumber: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
      })
      setIsEditOpen(false)
      setErrors({})
      fetchCustomers()
      fetchDetail(selectedCustomerId)
      Swal.fire({
        title: 'Thành công',
        text: 'Thông tin khách hàng đã được cập nhật.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: '#10192b',
        color: '#fff',
      })
    } catch (err) {
      const applied = applyBackendFormErrors(err, setErrors)
      if (!applied) {
        setErrors({ general: customerErrorMessage(err) })
      }
    }
  }

  // Delete profile handler
  const handleDeleteCustomer = (id: string) => {
    Swal.fire({
      title: 'Xác nhận xóa?',
      text: 'Hồ sơ khách hàng sẽ bị xóa mềm và không hiển thị trong danh sách.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xóa hồ sơ',
      cancelButtonText: 'Hủy',
      background: '#10192b',
      color: '#fff',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await customerApi.deleteCustomer(id)
          setSelectedCustomerId(null)
          fetchCustomers()
          Swal.fire({
            title: 'Đã xóa',
            text: 'Hồ sơ đã được xóa thành công.',
            icon: 'success',
            background: '#10192b',
            color: '#fff',
          })
        } catch (err) {
          Swal.fire({
            title: 'Lỗi',
            text: customerErrorMessage(err),
            icon: 'error',
            background: '#10192b',
            color: '#fff',
          })
        }
      }
    })
  }

  // Merge Handler Trigger
  const openMergeWizard = (duplicateRecord: Customer) => {
    if (!detail) return
    setMergeSource(duplicateRecord)
    setSelectedMergeName(detail.displayName)
    setSelectedMergePhone(detail.phoneNumber || duplicateRecord.phoneNumber || '')
    setSelectedMergeEmail(detail.email || duplicateRecord.email || '')
    setIsMergeOpen(true)
  }

  const executeMerge = async () => {
    if (!detail || !mergeSource) return

    Swal.fire({
      title: 'Đang gộp hồ sơ...',
      html: 'Hệ thống đang chuyển các liên kết sàn và hợp nhất dữ liệu PII.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      },
      background: '#10192b',
      color: '#fff',
    })

    try {
      await customerApi.mergeCustomers({
        sourceCustomerId: mergeSource.id,
        targetCustomerId: detail.id,
        selectedDisplayName: selectedMergeName,
        selectedPhone: selectedMergePhone || undefined,
        selectedEmail: selectedMergeEmail || undefined,
      })

      setIsMergeOpen(false)
      setMergeSource(null)
      Swal.close()

      Swal.fire({
        title: 'Hợp nhất thành công',
        text: 'Hồ sơ trùng lặp đã được gộp. Các kênh bán hàng và lịch sử tương tác đã được tích hợp vào hồ sơ này.',
        icon: 'success',
        background: '#10192b',
        color: '#fff',
      })

      // Refresh list and detail views
      fetchCustomers()
      fetchDetail(detail.id)
    } catch (err) {
      Swal.fire({
        title: 'Lỗi khi gộp',
        text: customerErrorMessage(err),
        icon: 'error',
        background: '#10192b',
        color: '#fff',
      })
    }
  }

  // Render client-side segment tag based on value
  const renderSegmentTag = (c: Customer) => {
    if (c.identityStatus === 'MERGED') {
      return <span className="segment-tag tag-merged">Đã Gộp</span>
    }
    const spend = c.totalSpend || 0
    const orders = c.totalOrders || 0
    if (spend >= 20000000 || orders >= 25) {
      return <span className="segment-tag tag-vip">VIP ✨</span>
    }
    if (spend >= 5000000) {
      return <span className="segment-tag tag-loyal">Loyal</span>
    }
    // Check if new
    const days = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    if (days <= 14) {
      return <span className="segment-tag tag-new">Mới</span>
    }
    if (spend > 0 && spend < 1000000) {
      return <span className="segment-tag tag-churn">At Risk</span>
    }
    return <span className="segment-tag tag-loyal">Standard</span>
  }

  // Helper to format currency
  const formatVND = (num?: number) => {
    if (num === undefined) return '0đ'
    return num.toLocaleString('vi-VN') + 'đ'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(-2)
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  // Filtering on activeTab
  const getFilteredCustomers = () => {
    if (activeTab === 'ALL') return customers
    return customers.filter(c => {
      const spend = c.totalSpend || 0
      const orders = c.totalOrders || 0
      const days = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)

      if (activeTab === 'VIP') return spend >= 20000000 || orders >= 25
      if (activeTab === 'LOYAL') return spend >= 5000000 && spend < 20000000
      if (activeTab === 'NEW') return days <= 14
      if (activeTab === 'CHURN') return spend > 0 && spend < 1000000
      return true
    })
  }

  const filteredList = getFilteredCustomers()

  return (
    <div className="customer-page">
      {/* 1. Header */}
      <div className="customer-header">
        <div className="customer-header-title">
          <h1>Quản lý khách hàng (CRM)</h1>
          <span className="customer-total-badge">Tổng: {totalElements} Profiles</span>
        </div>
        <div className="customer-actions">
          <button className="btn" onClick={() => fetchCustomers()}>
            <SyncOutlined spin={loading} /> Làm mới
          </button>
          <button className="btn btn-primary" onClick={() => {
            setFormName('')
            setFormPhone('')
            setFormEmail('')
            setErrors({})
            setIsCreateOpen(true)
          }}>
            <PlusOutlined /> Thêm khách hàng
          </button>
        </div>
      </div>

      {/* 2. Stat Tabs */}
      <div className="customer-tabs">
        <button
          className={`customer-tab ${activeTab === 'ALL' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          Tất cả khách hàng <span>{stats.total}</span>
        </button>
        <button
          className={`customer-tab ${activeTab === 'VIP' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('VIP')}
        >
          Hội viên VIP ✨ <span>{stats.vip}</span>
        </button>
        <button
          className={`customer-tab ${activeTab === 'LOYAL' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('LOYAL')}
        >
          Thân thiết (Loyal) <span>{stats.loyal}</span>
        </button>
        <button
          className={`customer-tab ${activeTab === 'NEW' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('NEW')}
        >
          Khách hàng mới <span>{stats.new}</span>
        </button>
        <button
          className={`customer-tab ${activeTab === 'CHURN' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('CHURN')}
        >
          Rủi ro rời bỏ (Churn) <span>{stats.churn}</span>
        </button>
      </div>

      {/* 3. Search and Filters */}
      <div className="customer-filters">
        <div className="search-input-wrapper">
          <SearchOutlined className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Tìm tên, số điện thoại, email, mã..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Trạng thái: Tất cả</option>
          <option value="VERIFIED">Xác minh (VERIFIED)</option>
          <option value="UNVERIFIED">Chưa xác minh</option>
          <option value="MERGED">Đã gộp (MERGED)</option>
        </select>
      </div>

      {/* 4. Main CRM Table & Split CDP Details Drawer */}
      <div className="customer-split-layout">
        {/* Table Pane */}
        <div className="customer-list-pane">
          <div className="customer-table-container">
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                <SyncOutlined spin style={{ fontSize: 24, marginBottom: 12 }} />
                <div>Đang tải dữ liệu hồ sơ CDP...</div>
              </div>
            ) : filteredList.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                Không tìm thấy thông tin khách hàng phù hợp.
              </div>
            ) : (
              <table className="customer-table">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Phân hạng</th>
                    <th>Số đơn hàng</th>
                    <th>Tổng chi tiêu (CLV)</th>
                    <th>Trạng thái</th>
                    <th>Đơn gần nhất</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomerId(c.id)}
                      className={selectedCustomerId === c.id ? 'is-selected' : ''}
                    >
                      <td>
                        <div className="profile-cell">
                          <div className="profile-avatar">
                            {getInitials(c.displayName)}
                          </div>
                          <div className="profile-info">
                            <span className="profile-name">
                              {c.displayName}
                              {c.hasPotentialDuplicates && (
                                <WarningOutlined
                                  style={{ color: '#d97706', marginLeft: 6 }}
                                  title="Phát hiện trùng lặp cùng tên!"
                                />
                              )}
                            </span>
                            <span className="profile-phone">{c.phoneNumber || 'Không có sđt'}</span>
                          </div>
                        </div>
                      </td>
                      <td>{renderSegmentTag(c)}</td>
                      <td>
                        <span className="order-count">{c.totalOrders || 0} đơn</span>
                      </td>
                      <td>
                        <div className="clv-amount">{formatVND(c.totalSpend)}</div>
                        <div className="clv-rate">Tỉ lệ hoàn đơn 0%</div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: c.identityStatus === 'VERIFIED' ? '#059669' : c.identityStatus === 'MERGED' ? '#64748b' : '#d97706',
                          background: c.identityStatus === 'VERIFIED' ? '#ecfdf5' : c.identityStatus === 'MERGED' ? '#f1f5f9' : '#fffbeb',
                          padding: '2px 8px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                        }}>
                          {c.identityStatus}
                        </span>
                      </td>
                      <td>
                        <div className="last-order-code">
                          {c.totalOrders && c.totalOrders > 0 ? `#ORD-${c.customerCode.split('-')[1]}` : 'Chưa có'}
                        </div>
                        <div className="last-order-time">
                          {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="customer-pagination">
            <span className="pagination-info">
              Hiển thị {filteredList.length} trong số {totalElements} profiles khách hàng
            </span>
            <Pagination
              current={page + 1}
              pageSize={20}
              total={totalElements}
              showSizeChanger={false}
              showTotal={(total) => `${total} khách hàng`}
              onChange={(nextPage) => {
                const zeroBasedPage = nextPage - 1
                setPage(zeroBasedPage)
                void fetchCustomers(zeroBasedPage)
              }}
            />
          </div>
        </div>

        {/* CDP Detail Drawer Pane */}
        {selectedCustomerId && (
          <div className="customer-detail-drawer">
            {detailLoading ? (
              <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
                <SyncOutlined spin style={{ fontSize: 24, color: '#2d68e8' }} />
              </div>
            ) : detail ? (
              <>
                <div className="drawer-header">
                  <div>
                    <h2>Hồ sơ khách hàng (CDP)</h2>
                    <small style={{ color: '#64748b', fontWeight: 600 }}>Mã: {detail.customerCode}</small>
                  </div>
                  <button className="drawer-close-btn" onClick={() => setSelectedCustomerId(null)}>
                    <CloseOutlined />
                  </button>
                </div>

                <div className="drawer-content">
                  {/* Warning banner for potential duplicates */}
                  {detail.identityStatus !== 'MERGED' && duplicates.length > 0 && (
                    <div className="duplicate-warning-banner">
                      <div className="duplicate-warning-title">
                        <WarningOutlined /> Phát hiện {duplicates.length} hồ sơ trùng tên!
                      </div>
                      <div className="duplicate-warning-desc">
                        Quy tắc ERP không tự động gộp các khách hàng cùng tên để tránh sai sót. Quản trị viên vui lòng đối chiếu thông tin và tiến hành gộp thủ công.
                      </div>
                      {duplicates.map(dup => (
                        <div
                          key={dup.id}
                          style={{
                            background: '#fff',
                            border: '1px solid #fde68a',
                            borderRadius: 8,
                            padding: 10,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ fontSize: 12 }}>
                            <strong>{dup.displayName}</strong>
                            <div style={{ color: '#64748b', fontSize: 10 }}>Sđt: {dup.phoneNumber || 'Trống'} | Mã: {dup.customerCode}</div>
                          </div>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => openMergeWizard(dup)}
                          >
                            Gộp hồ sơ
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Profile Header Card */}
                  <div className="cdp-card" style={{ background: 'linear-gradient(135deg, #eff6ff, #f8fafc)' }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <div className="profile-avatar" style={{ width: 48, height: 48, fontSize: 16 }}>
                        {getInitials(detail.displayName)}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 750, color: '#1e293b' }}>
                          {detail.displayName}
                        </h3>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#1d4ed8',
                          background: '#dbeafe',
                          padding: '2px 6px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                          marginTop: 4,
                          display: 'inline-block',
                        }}>
                          {detail.identityStatus}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      {detail.identityStatus !== 'MERGED' && (
                        <>
                          <button className="btn btn-sm" onClick={() => {
                            setFormName(detail.displayName)
                            setFormPhone(detail.phoneNumber || '')
                            setFormEmail(detail.email || '')
                            setErrors({})
                            setIsEditOpen(true)
                          }}>
                            <EditOutlined /> Sửa
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteCustomer(detail.id)}>
                            <DeleteOutlined /> Xóa
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tabs inside drawer */}
                  <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #edf2f7', paddingBottom: 6 }}>
                    <button
                      className={`customer-tab btn-sm ${activeDetailTab === 'profile' ? 'is-active' : ''}`}
                      onClick={() => setActiveDetailTab('profile')}
                    >
                      Thông tin chung
                    </button>
                    <button
                      className={`customer-tab btn-sm ${activeDetailTab === 'channels' ? 'is-active' : ''}`}
                      onClick={() => setActiveDetailTab('channels')}
                    >
                      Liên kết sàn ({detail.linkedChannels.length})
                    </button>
                    <button
                      className={`customer-tab btn-sm ${activeDetailTab === 'timeline' ? 'is-active' : ''}`}
                      onClick={() => setActiveDetailTab('timeline')}
                    >
                      Lịch sử tương tác
                    </button>
                  </div>

                  {/* Tab 1: Profile information */}
                  {activeDetailTab === 'profile' && (
                    <div className="profile-fields">
                      <div className="cdp-card">
                        <div className="cdp-card-title">Dữ liệu định danh PII</div>
                        <div className="field-row" style={{ marginBottom: 12 }}>
                          <span className="field-label">Số điện thoại:</span>
                          <span className="field-value">{detail.phoneNumber || 'Không có'}</span>
                        </div>
                        <div className="field-row">
                          <span className="field-label">Email liên hệ:</span>
                          <span className="field-value">{detail.email || 'Không có'}</span>
                        </div>
                      </div>

                      <div className="cdp-card">
                        <div className="cdp-card-title">Tổng quan tiêu dùng (CLV)</div>
                        <div className="field-row" style={{ marginBottom: 12 }}>
                          <span className="field-label">Tổng đơn hàng:</span>
                          <span className="field-value">{detail.metrics.totalOrders} đơn</span>
                        </div>
                        <div className="field-row" style={{ marginBottom: 12 }}>
                          <span className="field-label">Tổng doanh thu CLV:</span>
                          <span className="field-value" style={{ color: '#1d4ed8', fontWeight: 800 }}>
                            {formatVND(detail.metrics.totalSpend)}
                          </span>
                        </div>
                        <div className="field-row">
                          <span className="field-label">Kênh mua sắm ưa thích:</span>
                          <span className="field-value">{detail.metrics.lastChannelSeen}</span>
                        </div>
                      </div>

                      <div className="cdp-card">
                        <div className="cdp-card-title">Hệ thống & Đồng bộ</div>
                        <div className="field-row" style={{ marginBottom: 12 }}>
                          <span className="field-label">Thời gian tạo:</span>
                          <span className="field-value">
                            {new Date(detail.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        {detail.mergedIntoId && (
                          <div className="field-row">
                            <span className="field-label">Đã gộp vào profile:</span>
                            <span className="field-value" style={{ color: '#dc3545' }}>
                              Mã: {detail.mergedIntoId.substring(0, 8)}...
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Linked Marketplace Channels */}
                  {activeDetailTab === 'channels' && (
                    <div className="linked-channels-pane">
                      <div className="cdp-card-title" style={{ marginBottom: 12 }}>
                        Danh sách các tài khoản khách hàng trên sàn Shopee, Lazada, TikTok đã được liên kết
                      </div>
                      {detail.linkedChannels.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 13 }}>
                          Khách hàng này chưa liên kết với bất kỳ tài khoản sàn nào.
                        </div>
                      ) : (
                        detail.linkedChannels.map((ch) => (
                          <div className="linked-channel-item" key={ch.linkId}>
                            <div className="linked-channel-info">
                              <span className={`channel-icon ${
                                ch.channelName.toLowerCase().includes('tiktok') ? 'channel-tiktok' :
                                ch.channelName.toLowerCase().includes('lazada') ? 'channel-lazada' :
                                ch.channelName.toLowerCase().includes('shopee') ? 'channel-shopee' : 'channel-other'
                              }`}>
                                {ch.channelName[0]}
                              </span>
                              <div className="channel-detail">
                                <span className="channel-name">{ch.channelName} - {ch.accountName}</span>
                                <span className="channel-buyer">Người mua: {ch.buyerName} | {ch.phoneMasked || ch.emailMasked || 'Không rõ liên hệ'}</span>
                              </div>
                            </div>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: '#059669',
                              background: '#ecfdf5',
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}>
                              {ch.verificationStatus}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Tab 3: Timeline interaction history */}
                  {activeDetailTab === 'timeline' && (
                    <div className="interaction-timeline-pane">
                      <div className="cdp-card-title" style={{ marginBottom: 16 }}>
                        Nhật ký hành vi thời gian thực từ Lazada, TikTok Shop và Storefront
                      </div>
                      {interactions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 13 }}>
                          Chưa ghi nhận hoạt động tương tác nào của khách hàng này.
                        </div>
                      ) : (
                        <div className="timeline">
                          {interactions.map((event) => (
                            <div className="timeline-item" key={event.eventId}>
                              <div className="timeline-item-title">{event.eventName}</div>
                              <div className="timeline-item-subtitle">
                                Kênh: <strong>{event.marketplaceAccountName} ({event.marketplaceCode})</strong>
                                {event.screen && ` | Trang: ${event.screen}`}
                              </div>
                              <div className="timeline-item-time">
                                {new Date(event.occurredAt).toLocaleString('vi-VN')}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* 5. Create Customer Modal */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Tạo hồ sơ khách hàng mới</h3>
              <button className="drawer-close-btn" onClick={() => setIsCreateOpen(false)}>
                <CloseOutlined />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} noValidate>
              <div className="modal-body">
                {errors.general && <div className="form-error" style={{ marginBottom: 12, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>{errors.general}</div>}
                <div className="form-group">
                  <label>Họ và tên *</label>
                  <input
                    type="text"
                    className={`form-control ${errors.displayName ? 'is-invalid' : ''}`}
                    placeholder="Nhập tên đầy đủ (Ví dụ: Nguyễn Huy Hoàn)"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                  {errors.displayName && <span className="form-error">{errors.displayName}</span>}
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                    placeholder="Ví dụ: 0924777555"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                  />
                  {errors.phoneNumber && <span className="form-error">{errors.phoneNumber}</span>}
                </div>
                <div className="form-group">
                  <label>Email liên hệ</label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="Ví dụ: customer@domain.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setIsCreateOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Edit Customer Modal */}
      {isEditOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Chỉnh sửa hồ sơ khách hàng</h3>
              <button className="drawer-close-btn" onClick={() => setIsEditOpen(false)}>
                <CloseOutlined />
              </button>
            </div>
            <form onSubmit={handleUpdateCustomer} noValidate>
              <div className="modal-body">
                {errors.general && <div className="form-error" style={{ marginBottom: 12, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>{errors.general}</div>}
                <div className="form-group">
                  <label>Họ và tên *</label>
                  <input
                    type="text"
                    className={`form-control ${errors.displayName ? 'is-invalid' : ''}`}
                    placeholder="Nhập họ tên"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                  {errors.displayName && <span className="form-error">{errors.displayName}</span>}
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                    placeholder="Ví dụ: 0924777555"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                  />
                  {errors.phoneNumber && <span className="form-error">{errors.phoneNumber}</span>}
                </div>
                <div className="form-group">
                  <label>Email liên hệ</label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="Ví dụ: customer@domain.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setIsEditOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Merge Wizard Modal */}
      {isMergeOpen && detail && mergeSource && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ width: 780 }}>
            <div className="modal-header">
              <h3>Hợp nhất hồ sơ trùng lặp (Manual Merge Wizard)</h3>
              <button className="drawer-close-btn" onClick={() => setIsMergeOpen(false)}>
                <CloseOutlined />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#eff6ff', padding: 12, borderRadius: 8, border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: 13, marginBottom: 16 }}>
                <InfoCircleOutlined style={{ fontSize: 16 }} />
                <span>Bạn đang tiến hành gộp tài khoản trùng tên. Hãy chọn các trường thông tin chuẩn xác nhất để lưu lại trên hồ sơ chính. Dữ liệu kênh bán và lịch sử của hồ sơ phụ sẽ được tự động tích hợp.</span>
              </div>

              <div className="merge-grid">
                {/* Profile Đích (Keep) */}
                <div className="merge-profile-column is-target">
                  <span className="merge-column-title">
                    <CheckCircleOutlined style={{ color: '#2563eb' }} /> Hồ sơ giữ lại (Chính)
                  </span>
                  <div>
                    <strong>{detail.displayName}</strong>
                    <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>Mã khách hàng: {detail.customerCode}</div>
                    <div style={{ color: '#475569', fontSize: 11 }}>Doanh số: {formatVND(detail.metrics.totalSpend)} ({detail.metrics.totalOrders} đơn)</div>
                  </div>

                  <div className="merge-value-selector">
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>LỰA CHỌN TÊN:</label>
                    <div
                      className={`merge-option ${selectedMergeName === detail.displayName ? 'is-selected' : ''}`}
                      onClick={() => setSelectedMergeName(detail.displayName)}
                    >
                      <input
                        type="radio"
                        checked={selectedMergeName === detail.displayName}
                        onChange={() => setSelectedMergeName(detail.displayName)}
                      />
                      <div className="merge-option-label">
                        <span className="option-title">Tên gốc chính</span>
                        <span className="option-value">{detail.displayName}</span>
                      </div>
                    </div>

                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>LỰA CHỌN SỐ ĐIỆN THOẠI:</label>
                    <div
                      className={`merge-option ${selectedMergePhone === (detail.phoneNumber || '') ? 'is-selected' : ''}`}
                      onClick={() => setSelectedMergePhone(detail.phoneNumber || '')}
                    >
                      <input
                        type="radio"
                        checked={selectedMergePhone === (detail.phoneNumber || '')}
                        onChange={() => setSelectedMergePhone(detail.phoneNumber || '')}
                      />
                      <div className="merge-option-label">
                        <span className="option-title">Sđt gốc chính</span>
                        <span className="option-value">{detail.phoneNumber || 'Trống'}</span>
                      </div>
                    </div>

                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>LỰA CHỌN EMAIL:</label>
                    <div
                      className={`merge-option ${selectedMergeEmail === (detail.email || '') ? 'is-selected' : ''}`}
                      onClick={() => setSelectedMergeEmail(detail.email || '')}
                    >
                      <input
                        type="radio"
                        checked={selectedMergeEmail === (detail.email || '')}
                        onChange={() => setSelectedMergeEmail(detail.email || '')}
                      />
                      <div className="merge-option-label">
                        <span className="option-title">Email gốc chính</span>
                        <span className="option-value">{detail.email || 'Trống'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Nguồn (Merge and Disable) */}
                <div className="merge-profile-column">
                  <span className="merge-column-title">
                    <WarningOutlined style={{ color: '#d97706' }} /> Hồ sơ bị gộp (Phụ)
                  </span>
                  <div>
                    <strong>{mergeSource.displayName}</strong>
                    <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>Mã khách hàng: {mergeSource.customerCode}</div>
                    <div style={{ color: '#475569', fontSize: 11 }}>Doanh số: {formatVND(mergeSource.totalSpend)} ({mergeSource.totalOrders} đơn)</div>
                  </div>

                  <div className="merge-value-selector">
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>LỰA CHỌN TÊN:</label>
                    <div
                      className={`merge-option ${selectedMergeName === mergeSource.displayName ? 'is-selected' : ''}`}
                      onClick={() => setSelectedMergeName(mergeSource.displayName)}
                    >
                      <input
                        type="radio"
                        checked={selectedMergeName === mergeSource.displayName}
                        onChange={() => setSelectedMergeName(mergeSource.displayName)}
                      />
                      <div className="merge-option-label">
                        <span className="option-title">Tên từ hồ sơ phụ</span>
                        <span className="option-value">{mergeSource.displayName}</span>
                      </div>
                    </div>

                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>LỰA CHỌN SỐ ĐIỆN THOẠI:</label>
                    <div
                      className={`merge-option ${selectedMergePhone === (mergeSource.phoneNumber || '') ? 'is-selected' : ''}`}
                      onClick={() => setSelectedMergePhone(mergeSource.phoneNumber || '')}
                    >
                      <input
                        type="radio"
                        checked={selectedMergePhone === (mergeSource.phoneNumber || '')}
                        onChange={() => setSelectedMergePhone(mergeSource.phoneNumber || '')}
                      />
                      <div className="merge-option-label">
                        <span className="option-title">Sđt từ hồ sơ phụ</span>
                        <span className="option-value">{mergeSource.phoneNumber || 'Trống'}</span>
                      </div>
                    </div>

                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>LỰA CHỌN EMAIL:</label>
                    <div
                      className={`merge-option ${selectedMergeEmail === (mergeSource.email || '') ? 'is-selected' : ''}`}
                      onClick={() => setSelectedMergeEmail(mergeSource.email || '')}
                    >
                      <input
                        type="radio"
                        checked={selectedMergeEmail === (mergeSource.email || '')}
                        onChange={() => setSelectedMergeEmail(mergeSource.email || '')}
                      />
                      <div className="merge-option-label">
                        <span className="option-title">Email từ hồ sơ phụ</span>
                        <span className="option-value">{mergeSource.email || 'Trống'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setIsMergeOpen(false)}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={executeMerge}>
                Hợp nhất ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
