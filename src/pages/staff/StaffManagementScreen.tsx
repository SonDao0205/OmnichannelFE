import { useEffect, useState, useMemo } from 'react'
import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  KeyOutlined,
  LockOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UnlockOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import Swal from 'sweetalert2'
import axios from 'axios'
import { toast } from 'react-toastify'

import { staffApi, staffErrorMessage } from '../../apis/staffApi'
import type { StaffUser } from '../../apis/staffApi'
import type { ApiProblem } from '../../types/auth'
import './staff.css'

const PAGE_SIZE = 8

const statusTabs = [
  { value: 'ALL' as const, label: 'Tất cả nhân viên' },
  { value: 'ACTIVE' as const, label: 'Đang hoạt động' },
  { value: 'LOCKED' as const, label: 'Đã khóa' },
]

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})\b$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function StaffManagementScreen() {
  const [staffList, setStaffList] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'LOCKED'>('ALL')
  const [currentPage, setCurrentPage] = useState(0)

  // Modals state
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)

  // Form values state
  const [createValues, setCreateValues] = useState({ email: '', displayName: '', phoneNumber: '' })
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})

  const [editValues, setEditValues] = useState({ displayName: '', phoneNumber: '', status: 'ACTIVE' as 'ACTIVE' | 'LOCKED' })
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  const [passwordValues, setPasswordValues] = useState({ newPassword: '', confirmPassword: '' })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})

  // State for newly created staff details (summary inside modal)
  const [createdStaffDetails, setCreatedStaffDetails] = useState<{
    email: string
    displayName: string
    phoneNumber?: string
  } | null>(null)

  // Selected staff for edit/password actions
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null)

  // Load staff list on mount
  useEffect(() => {
    fetchStaff()
    document.title = 'Quản lý nhân viên CSKH | Omnichannel'
  }, [])

  // Reset page number on search/filter changes
  useEffect(() => {
    setCurrentPage(0)
  }, [searchText, statusFilter])

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const data = await staffApi.getStaffList()
      setStaffList(data)
    } catch (error) {
      toast.error(staffErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  // Helper to map and apply backend validation errors directly onto custom form fields
  const applyBackendFormErrors = (error: unknown, setErrorState: (errors: any) => void): boolean => {
    if (axios.isAxiosError(error)) {
      const problem = error.response?.data as ApiProblem | undefined
      const errors: Record<string, string> = {}
      if (problem?.fieldErrors && typeof problem.fieldErrors === 'object') {
        for (const [key, value] of Object.entries(problem.fieldErrors)) {
          errors[key] = value as string
        }
        setErrorState(errors)
        return true
      } else if (problem?.detail) {
        errors.general = problem.detail
        setErrorState(errors)
        return true
      }
    }
    return false
  }

  // Handle Search & Filter reset
  const handleResetFilters = () => {
    setSearchText('')
    setStatusFilter('ALL')
  }

  // Create staff handler
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}
    if (!createValues.email.trim()) {
      errors.email = 'Vui lòng nhập email!'
    } else if (!emailRegex.test(createValues.email.trim())) {
      errors.email = 'Email không đúng định dạng!'
    } else if (createValues.email.trim().length > 255) {
      errors.email = 'Email không được vượt quá 255 ký tự!'
    }

    if (!createValues.displayName.trim()) {
      errors.displayName = 'Vui lòng nhập họ và tên!'
    } else if (createValues.displayName.trim().length < 2) {
      errors.displayName = 'Họ tên phải có ít nhất 2 ký tự!'
    } else if (createValues.displayName.trim().length > 50) {
      errors.displayName = 'Họ tên không được vượt quá 50 ký tự!'
    }

    if (createValues.phoneNumber?.trim() && !phoneRegex.test(createValues.phoneNumber.trim())) {
      errors.phoneNumber = 'Số điện thoại không đúng định dạng Việt Nam!'
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors)
      return
    }

    setCreateErrors({})
    try {
      setLoading(true)
      const createdStaff = await staffApi.createStaff({
        email: createValues.email.trim(),
        displayName: createValues.displayName.trim(),
        phoneNumber: createValues.phoneNumber?.trim() || undefined,
      })
      toast.success('Cấp tài khoản thành công, mật khẩu đã được gửi qua email!')
      setCreateModalVisible(true) // keep open to display details
      setCreatedStaffDetails({
        email: createdStaff.email,
        displayName: createdStaff.displayName,
        phoneNumber: createdStaff.phoneNumber,
      })
      await fetchStaff()
    } catch (error) {
      const applied = applyBackendFormErrors(error, setCreateErrors)
      if (!applied) {
        setCreateErrors({ general: staffErrorMessage(error) })
      }
    } finally {
      setLoading(false)
    }
  }

  // Edit staff handler
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaff) return
    const errors: Record<string, string> = {}
    if (!editValues.displayName.trim()) {
      errors.displayName = 'Vui lòng nhập họ và tên!'
    } else if (editValues.displayName.trim().length < 2) {
      errors.displayName = 'Họ tên phải có ít nhất 2 ký tự!'
    } else if (editValues.displayName.trim().length > 50) {
      errors.displayName = 'Họ tên không được vượt quá 50 ký tự!'
    }

    if (editValues.phoneNumber?.trim() && !phoneRegex.test(editValues.phoneNumber.trim())) {
      errors.phoneNumber = 'Số điện thoại không đúng định dạng Việt Nam!'
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      return
    }

    setEditErrors({})
    try {
      setLoading(true)
      await staffApi.updateStaff(selectedStaff.id, {
        displayName: editValues.displayName.trim(),
        phoneNumber: editValues.phoneNumber?.trim() || undefined,
        status: editValues.status,
      })
      toast.success('Cập nhật thông tin nhân viên thành công!')
      setEditModalVisible(false)
      setSelectedStaff(null)
      await fetchStaff()
    } catch (error) {
      const applied = applyBackendFormErrors(error, setEditErrors)
      if (!applied) {
        setEditErrors({ general: staffErrorMessage(error) })
      }
    } finally {
      setLoading(false)
    }
  }

  // Reset password handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaff) return
    const errors: Record<string, string> = {}
    if (!passwordValues.newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới!'
    } else if (passwordValues.newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu phải chứa ít nhất 6 ký tự!'
    }

    if (!passwordValues.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới!'
    } else if (passwordValues.newPassword !== passwordValues.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp!'
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors)
      return
    }

    setPasswordErrors({})
    try {
      setLoading(true)
      await staffApi.resetPassword(selectedStaff.id, {
        password: passwordValues.newPassword,
      })

      await Swal.fire({
        title: 'Thành công',
        text: `Đã đổi mật khẩu cho nhân viên ${selectedStaff.displayName} thành công!`,
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        background: '#ffffff',
      })

      setPasswordModalVisible(false)
      setPasswordValues({ newPassword: '', confirmPassword: '' })
      setSelectedStaff(null)
    } catch (error) {
      const applied = applyBackendFormErrors(error, setPasswordErrors)
      if (!applied) {
        setPasswordErrors({ general: staffErrorMessage(error) })
      }
    } finally {
      setLoading(false)
    }
  }

  // Toggle staff status handler (Lock/Unlock)
  const handleToggleStatus = async (staff: StaffUser) => {
    const isLocking = staff.status === 'ACTIVE'
    const actionText = isLocking ? 'khóa' : 'mở khóa'
    const nextStatus = isLocking ? 'LOCKED' : 'ACTIVE'

    const result = await Swal.fire({
      title: `Xác nhận ${actionText} tài khoản?`,
      text: `Bạn có chắc chắn muốn ${actionText} tài khoản của ${staff.displayName} (${staff.email})?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isLocking ? '#ef4444' : '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: isLocking ? 'Khóa tài khoản' : 'Mở khóa',
      cancelButtonText: 'Hủy',
    })

    if (result.isConfirmed) {
      try {
        setLoading(true)
        await staffApi.toggleStaffStatus(staff.id, nextStatus)
        toast.success(`Đã ${actionText} tài khoản thành công!`)
        await fetchStaff()
      } catch (error) {
        toast.error(staffErrorMessage(error))
      } finally {
        setLoading(false)
      }
    }
  }

  // Delete staff handler
  const handleDeleteStaff = async (staff: StaffUser) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa tài khoản?',
      text: `Hành động này sẽ xóa vĩnh viễn tài khoản của ${staff.displayName}. Bạn không thể hoàn tác!`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Xóa vĩnh viễn',
      cancelButtonText: 'Hủy',
    })

    if (result.isConfirmed) {
      try {
        setLoading(true)
        await staffApi.deleteStaff(staff.id)
        toast.success('Đã xóa tài khoản nhân viên thành công!')
        await fetchStaff()
      } catch (error) {
        toast.error(staffErrorMessage(error))
      } finally {
        setLoading(false)
      }
    }
  }

  // Filtered staff list computation
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      const matchesSearch =
        staff.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchText.toLowerCase()) ||
        (staff.phoneNumber && staff.phoneNumber.includes(searchText))

      const matchesStatus =
        statusFilter === 'ALL' || staff.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [staffList, searchText, statusFilter])

  // Get initials for Avatar
  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
  }

  const total = filteredStaff.length
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const paginatedStaff = useMemo(() => {
    return filteredStaff.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
  }, [filteredStaff, currentPage])

  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) return [0]
    const start = Math.max(0, Math.min(currentPage - 1, totalPages - 3))
    return Array.from({ length: Math.min(3, totalPages) }, (_, index) => start + index)
  }, [currentPage, totalPages])

  return (
    <div className="staff-page">
      {/* HEADER SECTION */}
      <header className="staff-topbar">
        <div className="staff-title">
          <div>
            <p className="staff-eyebrow">Cửa hàng & Nhân sự</p>
            <h1>Nhân viên CSKH</h1>
          </div>
          <span className="staff-count-pill">{total} nhân viên</span>
        </div>

        <div className="staff-top-actions">
          <button
            aria-label="Tải lại danh sách"
            className="staff-ghost-button"
            onClick={() => {
              setLoading(true)
              fetchStaff()
            }}
            type="button"
          >
            <ReloadOutlined />
            Làm mới
          </button>
          <button
            className="staff-primary-button"
            onClick={() => {
              setCreateValues({ email: '', displayName: '', phoneNumber: '' })
              setCreateErrors({})
              setCreatedStaffDetails(null)
              setCreateModalVisible(true)
            }}
            type="button"
          >
            <PlusOutlined />
            Cấp tài khoản mới
          </button>
        </div>
      </header>

      {/* FILTER & DATA SECTION */}
      <section className="staff-content">
        <nav className="staff-status-tabs" aria-label="Trạng thái tài khoản nhân viên">
          {statusTabs.map((tab) => (
            <button
              className={`staff-status-tab ${statusFilter === tab.value ? 'is-active' : ''}`}
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value)
              }}
              type="button"
            >
              {tab.label}
              {statusFilter === tab.value && <span>{total}</span>}
            </button>
          ))}
        </nav>

        <div className="staff-toolbar">
          <label className="staff-search">
            <SearchOutlined />
            <input
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tìm tên, email hoặc số điện thoại..."
              type="search"
              value={searchText}
            />
          </label>
          {(searchText !== '' || statusFilter !== 'ALL') && (
            <button
              className="staff-ghost-button"
              onClick={handleResetFilters}
              type="button"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        {/* TABLE DATA */}
        <section className="staff-table-card" aria-label="Danh sách nhân viên CSKH">
          {loading ? (
            <div className="staff-state">
              <span className="staff-loading-spinner" />
              <strong>Đang tải danh sách nhân viên</strong>
              <p>Vui lòng chờ trong giây lát.</p>
            </div>
          ) : paginatedStaff.length === 0 ? (
            <div className="staff-state">
              <span className="staff-empty-icon"><UserOutlined /></span>
              <strong>Chưa có nhân viên phù hợp</strong>
              <p>Thay đổi bộ lọc hoặc cấp tài khoản nhân viên đầu tiên.</p>
              <button
                onClick={() => {
                  setCreateValues({ email: '', displayName: '', phoneNumber: '' })
                  setCreateErrors({})
                  setCreatedStaffDetails(null)
                  setCreateModalVisible(true)
                }}
                type="button"
              >
                Cấp tài khoản
              </button>
            </div>
          ) : (
            <>
              <div className="staff-table-scroll">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th className="staff-user-col">Nhân viên</th>
                      <th className="staff-email-col">Email</th>
                      <th className="staff-phone-col">Số điện thoại</th>
                      <th className="staff-status-col">Trạng thái</th>
                      <th className="staff-date-col">Ngày tạo</th>
                      <th className="staff-action-col">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStaff.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <div className="staff-user-cell">
                            <div className="staff-avatar">{getInitials(record.displayName)}</div>
                            <div className="staff-name-info">
                              <strong className="staff-main-text">{record.displayName}</strong>
                              <span className="staff-subtext">Nhân viên CSKH</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="staff-main-text">{record.email}</span>
                        </td>
                        <td>
                          <span className="staff-main-text">{record.phoneNumber || '—'}</span>
                        </td>
                        <td className="staff-status-col">
                          <span className={`staff-status-pill is-${record.status.toLowerCase()}`}>
                            {record.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </td>
                        <td>
                          <span className="staff-subtext">{formatDate(record.createdAt)}</span>
                        </td>
                        <td className="staff-action-col">
                          <div className="staff-actions">
                            <button
                              className="staff-action-btn"
                              title="Chỉnh sửa thông tin"
                              onClick={() => {
                                setSelectedStaff(record)
                                setEditValues({
                                  displayName: record.displayName,
                                  phoneNumber: record.phoneNumber || '',
                                  status: record.status,
                                })
                                setEditErrors({})
                                setEditModalVisible(true)
                              }}
                              type="button"
                            >
                              <EditOutlined />
                            </button>

                            <button
                              className={`staff-action-btn ${record.status === 'ACTIVE' ? 'is-danger' : 'is-success'}`}
                              title={record.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                              onClick={() => handleToggleStatus(record)}
                              type="button"
                            >
                              {record.status === 'ACTIVE' ? <LockOutlined /> : <UnlockOutlined />}
                            </button>

                            <button
                              className="staff-action-btn"
                              title="Đặt lại mật khẩu"
                              onClick={() => {
                                setSelectedStaff(record)
                                setPasswordValues({ newPassword: '', confirmPassword: '' })
                                setPasswordErrors({})
                                setPasswordModalVisible(true)
                              }}
                              type="button"
                            >
                              <KeyOutlined />
                            </button>

                            <button
                              className="staff-action-btn is-danger"
                              title="Xóa tài khoản"
                              onClick={() => handleDeleteStaff(record)}
                              type="button"
                            >
                              <DeleteOutlined />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <footer className="staff-table-footer">
                <span>
                  Hiển thị {currentPage * PAGE_SIZE + 1}–
                  {Math.min((currentPage + 1) * PAGE_SIZE, total)} trong {total} nhân viên
                </span>
                <div className="staff-pagination">
                  <button
                    disabled={currentPage === 0}
                    onClick={() => {
                      setCurrentPage((current) => Math.max(0, current - 1))
                    }}
                    type="button"
                  >
                    ‹
                  </button>
                  {pageNumbers.map((pageNumber) => (
                    <button
                      className={currentPage === pageNumber ? 'is-active' : ''}
                      key={pageNumber}
                      onClick={() => {
                        setCurrentPage(pageNumber)
                      }}
                      type="button"
                    >
                      {pageNumber + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage + 1 >= totalPages}
                    onClick={() => {
                      setCurrentPage((current) => current + 1)
                    }}
                    type="button"
                  >
                    ›
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>
      </section>

      {/* MODAL: CREATE ACCOUNT & ACCOUNT SUMMARY */}
      {createModalVisible && (
        <div className="staff-modal-backdrop" role="presentation">
          <section
            aria-labelledby="create-staff-title"
            aria-modal="true"
            className="staff-modal"
            role="dialog"
          >
            <header className="staff-modal-header">
              <div>
                <span className="staff-modal-icon">
                  {createdStaffDetails ? <CheckCircleOutlined /> : <PlusOutlined />}
                </span>
                <div>
                  <p>{createdStaffDetails ? 'Hoàn tất' : 'Nhân viên mới'}</p>
                  <h2 id="create-staff-title">
                    {createdStaffDetails ? 'Cấp tài khoản thành công' : 'Cấp tài khoản CSKH mới'}
                  </h2>
                </div>
              </div>
              <button
                aria-label="Đóng"
                className="staff-modal-close"
                onClick={() => {
                  setCreateModalVisible(false)
                  setCreatedStaffDetails(null)
                  setCreateValues({ email: '', displayName: '', phoneNumber: '' })
                  setCreateErrors({})
                }}
                type="button"
              >
                <CloseOutlined />
              </button>
            </header>

            {createdStaffDetails ? (
              <div className="created-staff-result">
                <div className="created-staff-banner">
                  <div>
                    <strong>Tài khoản đã được cấp thành công!</strong>
                    <p>Mật khẩu tạm thời đã được gửi tới email đăng nhập.</p>
                  </div>
                </div>
                <dl>
                  <div>
                    <dt>Họ và tên</dt>
                    <dd>{createdStaffDetails.displayName}</dd>
                  </div>
                  <div>
                    <dt>Email đăng nhập</dt>
                    <dd>{createdStaffDetails.email}</dd>
                  </div>
                  {createdStaffDetails.phoneNumber && (
                    <div>
                      <dt>Số điện thoại</dt>
                      <dd>{createdStaffDetails.phoneNumber}</dd>
                    </div>
                  )}
                </dl>
                <div className="created-staff-result-warning-box">
                  <span>✉️</span>
                  <span><strong>Đã gửi email:</strong> Nhân viên dùng mật khẩu tạm thời trong thư và phải đổi mật khẩu ở lần đăng nhập đầu tiên.</span>
                </div>
                <div className="staff-form-actions">
                  <button
                    className="staff-primary-button"
                    onClick={() => {
                      setCreateModalVisible(false)
                      setCreatedStaffDetails(null)
                      setCreateValues({ email: '', displayName: '', phoneNumber: '' })
                      setCreateErrors({})
                    }}
                    type="button"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : (
              <form className="staff-form" onSubmit={handleCreateSubmit}>
                <div className="staff-form-section">
                  <div className="staff-form-heading">
                    <strong>Tài khoản đăng nhập</strong>
                    <span>Email dùng để đăng nhập vào hệ thống.</span>
                  </div>
                  <div className="staff-form-grid">
                    <label>
                      <span>Email đăng nhập *</span>
                      <input
                        className={createErrors.email ? 'is-invalid' : ''}
                        placeholder="nhanvien@company.com"
                        type="email"
                        value={createValues.email}
                        onChange={(e) => setCreateValues({ ...createValues, email: e.target.value })}
                      />
                      {createErrors.email && <span className="staff-form-error">{createErrors.email}</span>}
                    </label>
                  </div>
                </div>

                <div className="staff-form-section">
                  <div className="staff-form-heading">
                    <strong>Thông tin cá nhân</strong>
                    <span>Họ tên và số điện thoại liên hệ.</span>
                  </div>
                  <div className="staff-form-grid">
                    <label>
                      <span>Họ và tên *</span>
                      <input
                        className={createErrors.displayName ? 'is-invalid' : ''}
                        placeholder="Nguyễn Văn A"
                        type="text"
                        value={createValues.displayName}
                        onChange={(e) => setCreateValues({ ...createValues, displayName: e.target.value })}
                      />
                      {createErrors.displayName && <span className="staff-form-error">{createErrors.displayName}</span>}
                    </label>
                    <label style={{ marginTop: '10px' }}>
                      <span>Số điện thoại</span>
                      <input
                        className={createErrors.phoneNumber ? 'is-invalid' : ''}
                        placeholder="Ví dụ: 0912345678"
                        type="text"
                        value={createValues.phoneNumber}
                        onChange={(e) => setCreateValues({ ...createValues, phoneNumber: e.target.value })}
                      />
                      {createErrors.phoneNumber && <span className="staff-form-error">{createErrors.phoneNumber}</span>}
                    </label>
                  </div>
                </div>

                {createErrors.general && (
                  <div className="staff-error-banner" role="alert">
                    {createErrors.general}
                  </div>
                )}
                <footer className="staff-form-actions">
                  <button
                    className="staff-cancel-button"
                    onClick={() => {
                      setCreateModalVisible(false)
                      setCreateValues({ email: '', displayName: '', phoneNumber: '' })
                      setCreateErrors({})
                    }}
                    type="button"
                  >
                    Hủy
                  </button>
                  <button className="staff-primary-button" disabled={loading} type="submit">
                    {loading ? <span className="staff-button-spinner" /> : <PlusOutlined />}
                    {loading ? 'Đang cấp...' : 'Cấp tài khoản'}
                  </button>
                </footer>
              </form>
            )}
          </section>
        </div>
      )}

      {/* MODAL: EDIT STAFF DETAILS */}
      {editModalVisible && selectedStaff && (
        <div className="staff-modal-backdrop" role="presentation">
          <section
            aria-labelledby="edit-staff-title"
            aria-modal="true"
            className="staff-modal"
            role="dialog"
          >
            <header className="staff-modal-header">
              <div>
                <span className="staff-modal-icon">
                  <EditOutlined />
                </span>
                <div>
                  <p>Chỉnh sửa</p>
                  <h2 id="edit-staff-title">Chỉnh sửa thông tin nhân viên</h2>
                </div>
              </div>
              <button
                aria-label="Đóng"
                className="staff-modal-close"
                onClick={() => {
                  setEditModalVisible(false)
                  setSelectedStaff(null)
                  setEditErrors({})
                }}
                type="button"
              >
                <CloseOutlined />
              </button>
            </header>

            <form className="staff-form" onSubmit={handleEditSubmit}>
              <div style={{ margin: '16px 20px 0', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#475569', fontSize: '12px', display: 'block' }}>Tài khoản đang chỉnh sửa:</strong>
                <span style={{ color: '#0f172a', fontWeight: 700, fontSize: '13px' }}>{selectedStaff.email}</span>
              </div>

              <div className="staff-form-section">
                <div className="staff-form-heading">
                  <strong>Thông tin cá nhân</strong>
                  <span>Họ tên và số điện thoại của nhân viên.</span>
                </div>
                <div className="staff-form-grid">
                  <label>
                    <span>Họ và tên *</span>
                    <input
                      className={editErrors.displayName ? 'is-invalid' : ''}
                      placeholder="Nguyễn Văn A"
                      type="text"
                      value={editValues.displayName}
                      onChange={(e) => setEditValues({ ...editValues, displayName: e.target.value })}
                    />
                    {editErrors.displayName && <span className="staff-form-error">{editErrors.displayName}</span>}
                  </label>
                  <label style={{ marginTop: '10px' }}>
                    <span>Số điện thoại</span>
                    <input
                      className={editErrors.phoneNumber ? 'is-invalid' : ''}
                      placeholder="Ví dụ: 0912345678"
                      type="text"
                      value={editValues.phoneNumber}
                      onChange={(e) => setEditValues({ ...editValues, phoneNumber: e.target.value })}
                    />
                    {editErrors.phoneNumber && <span className="staff-form-error">{editErrors.phoneNumber}</span>}
                  </label>
                </div>
              </div>

              <div className="staff-form-section">
                <div className="staff-form-heading">
                  <strong>Trạng thái</strong>
                  <span>Cấu hình quyền hoạt động của tài khoản.</span>
                </div>
                <div className="staff-form-grid">
                  <label>
                    <span>Trạng thái tài khoản *</span>
                    <select
                      className={editErrors.status ? 'is-invalid' : ''}
                      value={editValues.status}
                      onChange={(e) => setEditValues({ ...editValues, status: e.target.value as 'ACTIVE' | 'LOCKED' })}
                    >
                      <option value="ACTIVE">Đang hoạt động</option>
                      <option value="LOCKED">Đã khóa</option>
                    </select>
                    {editErrors.status && <span className="staff-form-error">{editErrors.status}</span>}
                  </label>
                </div>
              </div>

              {editErrors.general && (
                <div className="staff-error-banner" role="alert">
                  {editErrors.general}
                </div>
              )}
              <footer className="staff-form-actions">
                <button
                  className="staff-cancel-button"
                  onClick={() => {
                    setEditModalVisible(false)
                    setSelectedStaff(null)
                    setEditErrors({})
                  }}
                  type="button"
                >
                  Hủy
                </button>
                <button className="staff-primary-button" disabled={loading} type="submit">
                  {loading ? <span className="staff-button-spinner" /> : <EditOutlined />}
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {passwordModalVisible && selectedStaff && (
        <div className="staff-modal-backdrop" role="presentation">
          <section
            aria-labelledby="password-staff-title"
            aria-modal="true"
            className="staff-modal"
            role="dialog"
          >
            <header className="staff-modal-header">
              <div>
                <span className="staff-modal-icon">
                  <KeyOutlined />
                </span>
                <div>
                  <p>Bảo mật</p>
                  <h2 id="password-staff-title">Đặt lại mật khẩu mới</h2>
                </div>
              </div>
              <button
                aria-label="Đóng"
                className="staff-modal-close"
                onClick={() => {
                  setPasswordModalVisible(false)
                  setSelectedStaff(null)
                  setPasswordValues({ newPassword: '', confirmPassword: '' })
                  setPasswordErrors({})
                }}
                type="button"
              >
                <CloseOutlined />
              </button>
            </header>

            <form className="staff-form" onSubmit={handlePasswordSubmit}>
              <div style={{ margin: '16px 20px 0', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#475569', fontSize: '12px', display: 'block' }}>Đặt lại mật khẩu cho nhân viên:</strong>
                <span style={{ color: '#0f172a', fontWeight: 700, fontSize: '13px' }}>
                  {selectedStaff.displayName} ({selectedStaff.email})
                </span>
              </div>

              <div className="staff-form-section">
                <div className="staff-form-heading">
                  <strong>Mật khẩu mới</strong>
                  <span>Thiết lập mật khẩu truy cập mới cho tài khoản.</span>
                </div>
                <div className="staff-form-grid">
                  <label>
                    <span>Mật khẩu mới *</span>
                    <input
                      className={passwordErrors.newPassword ? 'is-invalid' : ''}
                      placeholder="Nhập ít nhất 6 ký tự"
                      type="password"
                      value={passwordValues.newPassword}
                      onChange={(e) => setPasswordValues({ ...passwordValues, newPassword: e.target.value })}
                    />
                    {passwordErrors.newPassword && <span className="staff-form-error">{passwordErrors.newPassword}</span>}
                  </label>
                  <label style={{ marginTop: '10px' }}>
                    <span>Xác nhận mật khẩu *</span>
                    <input
                      className={passwordErrors.confirmPassword ? 'is-invalid' : ''}
                      placeholder="Nhập lại mật khẩu mới"
                      type="password"
                      value={passwordValues.confirmPassword}
                      onChange={(e) => setPasswordValues({ ...passwordValues, confirmPassword: e.target.value })}
                    />
                    {passwordErrors.confirmPassword && <span className="staff-form-error">{passwordErrors.confirmPassword}</span>}
                  </label>
                </div>
              </div>

              {passwordErrors.general && (
                <div className="staff-error-banner" role="alert">
                  {passwordErrors.general}
                </div>
              )}
              <footer className="staff-form-actions">
                <button
                  className="staff-cancel-button"
                  onClick={() => {
                    setPasswordModalVisible(false)
                    setSelectedStaff(null)
                    setPasswordValues({ newPassword: '', confirmPassword: '' })
                    setPasswordErrors({})
                  }}
                  type="button"
                >
                  Hủy
                </button>
                <button className="staff-primary-button" disabled={loading} type="submit">
                  {loading ? <span className="staff-button-spinner" /> : <KeyOutlined />}
                  {loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
