import {
  CheckCircleFilled,
  CloseOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
  PlusOutlined,
  RobotOutlined,
  ShopOutlined,
} from '@ant-design/icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import { toast } from 'react-toastify'
import {
  aiContextApi,
  aiContextErrorMessage,
} from '../../apis/aiContextApi'
import { marketplaceApi, marketplaceErrorMessage } from '../../apis/marketplaceApi'
import { ROUTES } from '../../routes/paths'
import type {
  AiContextMood,
  AiShopContext,
  AiShopContextPayload,
  AiShopKnowledgeStatus,
} from '../../types/aiContext'
import type { MarketplaceConnection } from '../../types/marketplace'
import './ai-context.css'

type ContextForm = {
  contextName: string
  mood: AiContextMood
  assistantName: string
  businessDescription: string
  brandVoice: string
  responseGuidelines: string
  prohibitedTopics: string
  defaultLanguage: string
  maxResponseCharacters: string
}

const MOODS: Array<{ value: AiContextMood; label: string; description: string }> = [
  { value: 'FRIENDLY', label: 'Thân thiện', description: 'Gần gũi, lịch sự' },
  { value: 'PROFESSIONAL', label: 'Chuyên nghiệp', description: 'Chính xác, có cấu trúc' },
  { value: 'WARM', label: 'Ấm áp', description: 'Quan tâm, chân thành' },
  { value: 'YOUTHFUL', label: 'Trẻ trung', description: 'Tích cực, tự nhiên' },
  { value: 'CONCISE', label: 'Ngắn gọn', description: 'Đi thẳng vào trọng tâm' },
  { value: 'EMPATHETIC', label: 'Đồng cảm', description: 'Bình tĩnh, thấu hiểu' },
  { value: 'CUSTOM', label: 'Tùy chỉnh', description: 'Theo hướng dẫn riêng' },
]

const EMPTY_FORM: ContextForm = {
  contextName: '',
  mood: 'FRIENDLY',
  assistantName: 'Trợ lý cửa hàng',
  businessDescription: '',
  brandVoice: 'Thân thiện, lịch sự, rõ ràng và không gây áp lực mua hàng',
  responseGuidelines: '',
  prohibitedTopics: '',
  defaultLanguage: 'vi',
  maxResponseCharacters: '1200',
}

function formatDate(value: string | null): string {
  if (!value) return 'Chưa active'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formFromContext(context: AiShopContext): ContextForm {
  return {
    contextName: context.contextName,
    mood: context.mood,
    assistantName: context.assistantName,
    businessDescription: context.businessDescription,
    brandVoice: context.brandVoice,
    responseGuidelines: context.responseGuidelines,
    prohibitedTopics: context.prohibitedTopics.join('\n'),
    defaultLanguage: context.defaultLanguage,
    maxResponseCharacters: String(context.maxResponseCharacters),
  }
}

export default function AiContextScreen() {
  const [shops, setShops] = useState<MarketplaceConnection[]>([])
  const [selectedShopId, setSelectedShopId] = useState('')
  const [contexts, setContexts] = useState<AiShopContext[]>([])
  const [knowledgeStatus, setKnowledgeStatus] = useState<AiShopKnowledgeStatus | null>(null)
  const [isLoadingShops, setIsLoadingShops] = useState(true)
  const [isLoadingContexts, setIsLoadingContexts] = useState(false)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<AiShopContext | null>(null)
  const [form, setForm] = useState<ContextForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedShop = useMemo(
    () => shops.find((shop) => shop.id === selectedShopId) ?? null,
    [selectedShopId, shops],
  )

  const loadContexts = useCallback(async (shopId: string) => {
    if (!shopId) {
      setContexts([])
      setKnowledgeStatus(null)
      return
    }
    setIsLoadingContexts(true)
    try {
      const [contextItems, status] = await Promise.all([
        aiContextApi.list(shopId),
        aiContextApi.knowledgeStatus(shopId).catch(() => null),
      ])
      setContexts(contextItems)
      setKnowledgeStatus(status)
    } catch (error) {
      toast.error(aiContextErrorMessage(error))
      setContexts([])
      setKnowledgeStatus(null)
    } finally {
      setIsLoadingContexts(false)
    }
  }, [])

  useEffect(() => {
    document.title = 'Omnichannel'
    let active = true
    marketplaceApi
      .list()
      .then((items) => {
        if (!active) return
        setShops(items)
        const initialShopId = items[0]?.id || ''
        setSelectedShopId(initialShopId)
        void loadContexts(initialShopId)
      })
      .catch((error) => {
        if (active) toast.error(marketplaceErrorMessage(error))
      })
      .finally(() => {
        if (active) setIsLoadingShops(false)
      })
    return () => {
      active = false
    }
  }, [loadContexts])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setIsModalOpen(true)
  }

  const openEdit = (context: AiShopContext) => {
    setEditing(context)
    setForm(formFromContext(context))
    setErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (workingId === 'save') return
    setIsModalOpen(false)
    setEditing(null)
    setErrors({})
  }

  const validate = (): AiShopContextPayload | null => {
    const nextErrors: Record<string, string> = {}
    const maxCharacters = Number(form.maxResponseCharacters)
    if (!selectedShopId) nextErrors.shop = 'Vui lòng chọn shop.'
    if (!form.contextName.trim()) nextErrors.contextName = 'Vui lòng nhập tên ngữ cảnh.'
    if (form.contextName.trim().length > 150) nextErrors.contextName = 'Tối đa 150 ký tự.'
    if (!form.assistantName.trim()) nextErrors.assistantName = 'Vui lòng nhập tên trợ lý.'
    if (!form.brandVoice.trim()) nextErrors.brandVoice = 'Vui lòng mô tả giọng điệu.'
    if (!form.defaultLanguage.trim()) nextErrors.defaultLanguage = 'Vui lòng nhập ngôn ngữ.'
    if (!Number.isInteger(maxCharacters) || maxCharacters < 100 || maxCharacters > 8000) {
      nextErrors.maxResponseCharacters = 'Nhập số nguyên từ 100 đến 8000.'
    }
    const prohibitedTopics = form.prohibitedTopics
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
    if (prohibitedTopics.length > 30) {
      nextErrors.prohibitedTopics = 'Tối đa 30 chủ đề, mỗi dòng một chủ đề.'
    }
    const normalizedTopics = prohibitedTopics.map((item) => item.toLocaleLowerCase('vi'))
    if (new Set(normalizedTopics).size !== normalizedTopics.length) {
      nextErrors.prohibitedTopics = 'Danh sách đang có chủ đề bị trùng.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return null
    return {
      marketplaceAccountId: selectedShopId,
      contextName: form.contextName.trim(),
      mood: form.mood,
      assistantName: form.assistantName.trim(),
      businessDescription: form.businessDescription.trim(),
      brandVoice: form.brandVoice.trim(),
      responseGuidelines: form.responseGuidelines.trim(),
      prohibitedTopics,
      defaultLanguage: form.defaultLanguage.trim(),
      maxResponseCharacters: maxCharacters,
      defaultKnowledgeBaseId: null,
    }
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    const payload = validate()
    if (!payload) return
    setWorkingId('save')
    try {
      if (editing) {
        await aiContextApi.update(editing.id, payload)
        toast.success('Đã cập nhật ngữ cảnh AI.')
      } else {
        await aiContextApi.create(payload)
        toast.success('Đã tạo ngữ cảnh AI. Hãy active để bắt đầu sử dụng.')
      }
      setIsModalOpen(false)
      setEditing(null)
      await loadContexts(selectedShopId)
    } catch (error) {
      toast.error(aiContextErrorMessage(error))
    } finally {
      setWorkingId(null)
    }
  }

  const toggleActive = async (context: AiShopContext) => {
    setWorkingId(`active:${context.id}`)
    try {
      const updated = await aiContextApi.setActive(context.id, !context.active)
      setContexts((current) =>
        current
          .map((item) => ({
            ...item,
            active: item.id === updated.id ? updated.active : false,
            activatedAt: item.id === updated.id ? updated.activatedAt : null,
          }))
          .sort((left, right) => Number(right.active) - Number(left.active)),
      )
      toast.success(
        updated.active
          ? `AI sẽ dùng “${updated.contextName}” cho ${updated.shopName}.`
          : 'Đã tắt ngữ cảnh. AI sẽ dùng cấu hình an toàn mặc định cho shop này.',
      )
    } catch (error) {
      toast.error(aiContextErrorMessage(error))
      await loadContexts(selectedShopId)
    } finally {
      setWorkingId(null)
    }
  }

  const remove = async (context: AiShopContext) => {
    const confirmation = await Swal.fire({
      title: 'Xóa ngữ cảnh AI?',
      text: context.active
        ? 'Ngữ cảnh này đang active. Sau khi xóa, AI sẽ dùng cấu hình an toàn mặc định.'
        : `Ngữ cảnh “${context.contextName}” sẽ bị xóa.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa ngữ cảnh',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#e5484d',
      reverseButtons: true,
    })
    if (!confirmation.isConfirmed) return
    setWorkingId(`delete:${context.id}`)
    try {
      await aiContextApi.delete(context.id)
      setContexts((current) => current.filter((item) => item.id !== context.id))
      toast.success('Đã xóa ngữ cảnh AI.')
    } catch (error) {
      toast.error(aiContextErrorMessage(error))
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <section className="ai-context-page">
      <header className="ai-context-header">
        <div>
          <span className="ai-context-eyebrow">AI theo từng cửa hàng</span>
          <h1>Ngữ cảnh trả lời</h1>
          <p>
            Tạo nhiều phong cách trả lời cho từng shop. Chỉ ngữ cảnh đang active
            mới được đưa vào AI khi xử lý hội thoại của shop đó.
          </p>
        </div>
        <button
          className="ai-context-primary-button"
          disabled={!selectedShopId || isLoadingShops}
          onClick={openCreate}
          type="button"
        >
          <PlusOutlined /> Thêm ngữ cảnh
        </button>
      </header>

      <div className="ai-context-toolbar">
        <label>
          <span><ShopOutlined /> Chọn shop</span>
          <select
            disabled={isLoadingShops}
            onChange={(event) => {
              const shopId = event.target.value
              setSelectedShopId(shopId)
              void loadContexts(shopId)
            }}
            value={selectedShopId}
          >
            {shops.length === 0 ? <option value="">Chưa có shop liên kết</option> : null}
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.shopName} · {shop.marketplaceName} · {shop.status}
              </option>
            ))}
          </select>
        </label>
        {selectedShop ? (
          <div className="ai-context-shop-summary">
            <span className={`shop-dot is-${selectedShop.status.toLowerCase()}`} />
            <span>
              <strong>{selectedShop.shopName}</strong>
              <small>{contexts.filter((item) => item.active).length} context đang active</small>
            </span>
          </div>
        ) : null}
      </div>

      {selectedShopId ? (
        <section className={`ai-knowledge-status is-${(knowledgeStatus?.status || 'empty').toLowerCase()}`}>
          <div className="ai-knowledge-status-title">
            <span><DatabaseOutlined /></span>
            <div>
              <strong>Kiến thức sản phẩm của AI</strong>
              <small>
                {knowledgeStatus
                  ? `Tự động mỗi 20 phút · Cập nhật: ${formatDate(knowledgeStatus.lastBuiltAt)}`
                  : 'Hệ thống tự động chuẩn bị dữ liệu mỗi 20 phút'}
              </small>
            </div>
          </div>
          <div className="ai-knowledge-metrics">
            <span><strong>{knowledgeStatus?.productCount ?? 0}</strong>Sản phẩm</span>
            <span><strong>{knowledgeStatus?.variantCount ?? 0}</strong>Biến thể</span>
            <span><strong>{knowledgeStatus?.missingColorCount ?? 0}</strong>Thiếu màu</span>
            <span><strong>{knowledgeStatus?.missingSizeCount ?? 0}</strong>Thiếu size</span>
            <span><strong>{knowledgeStatus?.cacheStatus ?? 'EMPTY'}</strong>Redis</span>
            <span><strong>{knowledgeStatus?.vectorStatus ?? 'PENDING'}</strong>Qdrant</span>
          </div>
          {knowledgeStatus?.lastError ? (
            <p className="ai-knowledge-error">{knowledgeStatus.lastError}</p>
          ) : null}
        </section>
      ) : null}

      {isLoadingShops || isLoadingContexts ? (
        <div className="ai-context-state"><LoadingOutlined spin /> Đang tải ngữ cảnh...</div>
      ) : !selectedShopId ? (
        <div className="ai-context-state is-empty">
          <ShopOutlined />
          <h2>Chưa có shop để cấu hình</h2>
          <p>Liên kết ít nhất một shop trước khi tạo ngữ cảnh riêng cho AI.</p>
          <Link to={ROUTES.connect}>Đi đến trang Liên kết sàn</Link>
        </div>
      ) : contexts.length === 0 ? (
        <div className="ai-context-state is-empty">
          <RobotOutlined />
          <h2>Shop này chưa có ngữ cảnh riêng</h2>
          <p>AI vẫn dùng cấu hình an toàn mặc định cho đến khi bạn tạo và active một dòng.</p>
          <button onClick={openCreate} type="button"><PlusOutlined /> Tạo ngữ cảnh đầu tiên</button>
        </div>
      ) : (
        <div className="ai-context-grid">
          {contexts.map((context) => {
            const mood = MOODS.find((item) => item.value === context.mood)
            const isWorking = workingId?.endsWith(context.id) ?? false
            return (
              <article className={`ai-context-card ${context.active ? 'is-active' : ''}`} key={context.id}>
                <div className="ai-context-card-head">
                  <span className="ai-context-robot"><RobotOutlined /></span>
                  <div>
                    <strong>{context.contextName}</strong>
                    <small>{mood?.label ?? context.mood} · Trợ lý {context.assistantName}</small>
                  </div>
                  <label className="ai-context-switch">
                    <input
                      checked={context.active}
                      disabled={isWorking}
                      onChange={() => void toggleActive(context)}
                      type="checkbox"
                    />
                    <span aria-hidden="true" />
                    <em>{isWorking && workingId?.startsWith('active:') ? 'Đang đổi...' : context.active ? 'Active' : 'Tắt'}</em>
                  </label>
                </div>
                {context.active ? (
                  <div className="ai-context-active-note">
                    <CheckCircleFilled /> Đang được AI sử dụng cho shop này
                  </div>
                ) : null}
                <dl>
                  <div><dt>Mood</dt><dd>{mood?.description ?? 'Tùy chỉnh'}</dd></div>
                  <div><dt>Ngôn ngữ</dt><dd>{context.defaultLanguage}</dd></div>
                  <div><dt>Độ dài</dt><dd>Tối đa {context.maxResponseCharacters} ký tự</dd></div>
                  <div><dt>Cập nhật</dt><dd>{formatDate(context.updatedAt)}</dd></div>
                </dl>
                <p className="ai-context-voice">{context.brandVoice}</p>
                <div className="ai-context-card-actions">
                  <button disabled={isWorking} onClick={() => openEdit(context)} type="button">
                    <EditOutlined /> Sửa
                  </button>
                  <button className="is-danger" disabled={isWorking} onClick={() => void remove(context)} type="button">
                    {workingId === `delete:${context.id}` ? <LoadingOutlined spin /> : <DeleteOutlined />} Xóa
                  </button>
                  <span>Active: {formatDate(context.activatedAt)}</span>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {isModalOpen ? (
        <div className="ai-context-modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <div className="ai-context-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div><span>{editing ? 'Chỉnh sửa' : 'Tạo mới'}</span><h2>{editing?.contextName ?? 'Ngữ cảnh AI'}</h2></div>
              <button aria-label="Đóng" onClick={closeModal} type="button"><CloseOutlined /></button>
            </header>
            <form onSubmit={save}>
              <div className="ai-context-form-grid">
                <label>
                  <span>Tên ngữ cảnh *</span>
                  <input maxLength={150} onChange={(event) => setForm({ ...form, contextName: event.target.value })} value={form.contextName} />
                  {errors.contextName ? <small>{errors.contextName}</small> : null}
                </label>
                <label>
                  <span>Mood *</span>
                  <select onChange={(event) => setForm({ ...form, mood: event.target.value as AiContextMood })} value={form.mood}>
                    {MOODS.map((mood) => <option key={mood.value} value={mood.value}>{mood.label}</option>)}
                  </select>
                </label>
                <label>
                  <span>Tên trợ lý *</span>
                  <input maxLength={100} onChange={(event) => setForm({ ...form, assistantName: event.target.value })} value={form.assistantName} />
                  {errors.assistantName ? <small>{errors.assistantName}</small> : null}
                </label>
                <label>
                  <span>Ngôn ngữ mặc định *</span>
                  <input maxLength={20} onChange={(event) => setForm({ ...form, defaultLanguage: event.target.value })} value={form.defaultLanguage} />
                  {errors.defaultLanguage ? <small>{errors.defaultLanguage}</small> : null}
                </label>
                <label className="is-full">
                  <span>Mô tả shop</span>
                  <textarea maxLength={4000} rows={3} onChange={(event) => setForm({ ...form, businessDescription: event.target.value })} value={form.businessDescription} />
                </label>
                <label className="is-full">
                  <span>Giọng điệu thương hiệu *</span>
                  <textarea maxLength={1000} rows={3} onChange={(event) => setForm({ ...form, brandVoice: event.target.value })} value={form.brandVoice} />
                  {errors.brandVoice ? <small>{errors.brandVoice}</small> : null}
                </label>
                <label className="is-full">
                  <span>Hướng dẫn AI trả lời</span>
                  <textarea maxLength={8000} placeholder="Ví dụ: Xưng em, không dùng emoji, luôn hỏi mã đơn khi khách hỏi vận chuyển..." rows={5} onChange={(event) => setForm({ ...form, responseGuidelines: event.target.value })} value={form.responseGuidelines} />
                </label>
                <label>
                  <span>Chủ đề không được trả lời</span>
                  <textarea maxLength={6000} placeholder={'Mỗi dòng một chủ đề\nTư vấn y tế\nThông tin đối thủ'} rows={4} onChange={(event) => setForm({ ...form, prohibitedTopics: event.target.value })} value={form.prohibitedTopics} />
                  {errors.prohibitedTopics ? <small>{errors.prohibitedTopics}</small> : null}
                </label>
                <label>
                  <span>Độ dài trả lời tối đa</span>
                  <input max="8000" min="100" onChange={(event) => setForm({ ...form, maxResponseCharacters: event.target.value })} type="number" value={form.maxResponseCharacters} />
                  {errors.maxResponseCharacters ? <small>{errors.maxResponseCharacters}</small> : null}
                </label>
              </div>
              <div className="ai-context-form-note">
                Context mới không tự active. Bạn có thể kiểm tra nội dung trước rồi bật tại danh sách.
              </div>
              <footer>
                <button disabled={workingId === 'save'} onClick={closeModal} type="button">Hủy</button>
                <button className="is-primary" disabled={workingId === 'save'} type="submit">
                  {workingId === 'save' ? <><LoadingOutlined spin /> Đang lưu...</> : editing ? 'Lưu thay đổi' : 'Tạo ngữ cảnh'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
