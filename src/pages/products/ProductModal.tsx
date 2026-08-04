import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  PlusOutlined,
  StarFilled,
  StarOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { Button, Col, Form, Input, InputNumber, message, Modal, Row, Select } from 'antd'
import type { Product, ProductMedia } from '../../types/product'

export type ProductMediaDraft = {
  key: string
  existingId?: string
  file?: File
  previewUrl: string
  mediaType: 'IMAGE' | 'VIDEO'
  primary: boolean
}

export type ProductFormSubmission = Partial<Product> & {
  mediaDrafts: ProductMediaDraft[]
}

interface ProductModalProps {
  open: boolean
  product: Product | null
  onCancel: () => void
  onSave: (values: ProductFormSubmission) => Promise<void>
}

function existingDraft(media: ProductMedia): ProductMediaDraft {
  return {
    key: media.id,
    existingId: media.id,
    previewUrl: media.publicUrl,
    mediaType: media.mediaType,
    primary: media.primary,
  }
}

export default function ProductModal({
  open,
  product,
  onCancel,
  onSave,
}: ProductModalProps) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [mediaDrafts, setMediaDrafts] = useState<ProductMediaDraft[]>([])
  const mediaDraftsRef = useRef<ProductMediaDraft[]>([])

  useEffect(() => {
    mediaDraftsRef.current = mediaDrafts
  }, [mediaDrafts])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    if (product) {
      form.setFieldsValue({
        code: product.code,
        name: product.name,
        category: product.category,
        description: product.description,
        costPrice: product.costPrice,
        status: product.status === 'LOW_STOCK' || product.status === 'OUT_OF_STOCK'
          ? 'ACTIVE'
          : product.status,
        variants: product.variants.map((variant) => ({
          id: variant.id,
          name: variant.name,
          sku: variant.sku,
          color: variant.color,
          size: variant.size,
          price: variant.price,
          stock: variant.stock,
        })),
      })
      queueMicrotask(() => {
        if (!cancelled) setMediaDrafts((product.media || []).map(existingDraft))
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        status: 'ACTIVE',
        category: 'ÁO KHOÁC / OUTERWEAR',
        costPrice: 0,
        variants: [{ name: 'Mặc định', sku: '', color: '', size: '', price: 0, stock: 0 }],
      })
      queueMicrotask(() => {
        if (!cancelled) setMediaDrafts([])
      })
    }
    return () => {
      cancelled = true
    }
  }, [form, open, product])

  useEffect(() => () => {
    mediaDraftsRef.current.forEach((item) => {
      if (item.file) URL.revokeObjectURL(item.previewUrl)
    })
  }, [])

  const primaryKey = useMemo(
    () => mediaDrafts.find((item) => item.primary)?.key,
    [mediaDrafts],
  )
  const pendingUploadCount = useMemo(
    () => mediaDrafts.filter((item) => item.file).length,
    [mediaDrafts],
  )

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return
    if (mediaDrafts.length + files.length > 20) {
      message.error('Mỗi sản phẩm được lưu tối đa 20 ảnh và video.')
      return
    }
    const pendingBytes = mediaDrafts.reduce(
      (total, item) => total + (item.file?.size ?? 0),
      0,
    ) + Array.from(files).reduce((total, file) => total + file.size, 0)
    if (pendingBytes > 200 * 1024 * 1024) {
      message.error('Mỗi lượt tải lên được tối đa 200MB.')
      return
    }
    const accepted: ProductMediaDraft[] = []
    for (const file of Array.from(files)) {
      const isImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
      const isVideo = ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)
      if (!isImage && !isVideo) {
        message.error(`${file.name}: định dạng không được hỗ trợ.`)
        continue
      }
      if ((isImage && file.size > 10 * 1024 * 1024)
        || (isVideo && file.size > 100 * 1024 * 1024)) {
        message.error(`${file.name}: ảnh tối đa 10MB, video tối đa 100MB.`)
        continue
      }
      accepted.push({
        key: `new-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        mediaType: isVideo ? 'VIDEO' : 'IMAGE',
        primary: mediaDrafts.length === 0 && accepted.length === 0,
      })
    }
    setMediaDrafts((current) => [...current, ...accepted])
  }

  const setPrimary = (key: string) => {
    setMediaDrafts((current) => current.map((item) => ({
      ...item,
      primary: item.key === key,
    })))
  }

  const moveMedia = (index: number, direction: -1 | 1) => {
    setMediaDrafts((current) => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const removeMedia = (key: string) => {
    setMediaDrafts((current) => {
      const removed = current.find((item) => item.key === key)
      if (removed?.file) URL.revokeObjectURL(removed.previewUrl)
      const next = current.filter((item) => item.key !== key)
      if (removed?.primary && next.length > 0) {
        next[0] = { ...next[0], primary: true }
      }
      return next
    })
  }

  const handleFinish = async (values: Partial<Product>) => {
    if (mediaDrafts.length > 0 && !primaryKey) {
      message.error('Vui lòng chọn một ảnh hoặc video làm media chính.')
      return
    }
    setSubmitting(true)
    try {
      await onSave({ ...values, mediaDrafts })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      cancelButtonProps={{ disabled: submitting }}
      cancelText="Hủy"
      closable={!submitting}
      confirmLoading={submitting}
      destroyOnHidden
      keyboard={!submitting}
      maskClosable={!submitting}
      okButtonProps={{ disabled: submitting }}
      okText={submitting
        ? pendingUploadCount > 0
          ? `Đang tải ${pendingUploadCount} file lên cloud...`
          : 'Đang lưu sản phẩm...'
        : product ? 'Cập nhật' : 'Tạo mới'}
      onCancel={onCancel}
      onOk={() => {
        if (!submitting) form.submit()
      }}
      open={open}
      title={product ? 'Sửa sản phẩm, biến thể và media' : 'Thêm sản phẩm mới'}
      width={980}
    >
      <Form disabled={submitting} form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}>
              <Input maxLength={255} placeholder="Ví dụ: Áo khoác denim nam" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="code" label="Mã sản phẩm" rules={[{ required: true, message: 'Vui lòng nhập mã sản phẩm' }]}>
              <Input maxLength={100} placeholder="DNM-AK204" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={10}>
            <Form.Item name="category" label="Danh mục">
              <Select options={[
                'ÁO KHOÁC / OUTERWEAR',
                'QUẦN JEAN / DENIM',
                'ÁO THUN & POLO',
                'PHỤ KIỆN / GIÀY DÉP',
              ].map((value) => ({ value, label: value }))} />
            </Form.Item>
          </Col>
          <Col span={7}>
            <Form.Item name="costPrice" label="Giá vốn (VNĐ)">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={7}>
            <Form.Item name="status" label="Trạng thái">
              <Select options={[
                { value: 'ACTIVE', label: 'Đang hoạt động' },
                { value: 'DRAFT', label: 'Bản nháp' },
                { value: 'INACTIVE', label: 'Tạm ngưng' },
              ]} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="Mô tả sản phẩm">
          <Input.TextArea rows={3} maxLength={4000} showCount />
        </Form.Item>

        <section className="product-modal-section">
          <div className="product-modal-section-heading">
            <div>
              <strong>Biến thể sản phẩm</strong>
              <span>Mỗi biến thể có SKU, giá và tồn kho riêng.</span>
            </div>
          </div>
          <Form.List
            name="variants"
            rules={[{
              validator: async (_, variants) => {
                if (!variants?.length) throw new Error('Sản phẩm phải có ít nhất một biến thể.')
              },
            }]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map((field) => (
                  <Row className="product-variant-editor" gutter={10} key={field.key}>
                    <Col span={5}>
                      <Form.Item name={[field.name, 'name']} label="Tên biến thể" rules={[{ required: true, message: 'Nhập tên' }]}>
                        <Input placeholder="Đen / Size M" />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item name={[field.name, 'color']} label="Màu sắc">
                        <Input placeholder="Đen" maxLength={100} />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item name={[field.name, 'size']} label="Kích thước">
                        <Input placeholder="M" maxLength={100} />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item name={[field.name, 'sku']} label="SKU" rules={[{ required: true, message: 'Nhập SKU' }]}>
                        <Input placeholder="AK204-BLK-M" />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name={[field.name, 'price']} label="Giá bán" rules={[{ required: true, message: 'Nhập giá' }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item name={[field.name, 'stock']} label="Tồn kho" rules={[{ required: true, message: 'Nhập tồn' }]}>
                        <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col className="product-variant-remove" span={1}>
                      <Button danger disabled={fields.length === 1} icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                    </Col>
                  </Row>
                ))}
                <Button icon={<PlusOutlined />} onClick={() => add({ name: '', sku: '', color: '', size: '', price: 0, stock: 0 })} type="dashed">
                  Thêm biến thể
                </Button>
                <Form.ErrorList errors={errors} />
              </>
            )}
          </Form.List>
        </section>

        <section className="product-modal-section">
          <div className="product-modal-section-heading">
            <div>
              <strong>Ảnh và video</strong>
              <span>Tối đa 20 file. Ảnh 10MB, video 100MB; dữ liệu được lưu trên Cloudinary.</span>
            </div>
            <label className="product-media-upload">
              <UploadOutlined /> Chọn nhiều file
              <input
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                disabled={submitting}
                multiple
                onChange={(event) => {
                  handleFiles(event.target.files)
                  event.target.value = ''
                }}
                type="file"
              />
            </label>
          </div>

          {mediaDrafts.length === 0 ? (
            <div className="product-media-empty">Chưa có ảnh hoặc video cho sản phẩm.</div>
          ) : (
            <div className="product-media-grid">
              {mediaDrafts.map((item, index) => (
                <article className={`product-media-item ${item.primary ? 'is-primary' : ''}`} key={item.key}>
                  <div className="product-media-preview">
                    {item.mediaType === 'VIDEO' ? (
                      <video controls preload="metadata" src={item.previewUrl} />
                    ) : (
                      <img alt={`Media ${index + 1}`} src={item.previewUrl} />
                    )}
                    <span>{item.mediaType === 'VIDEO' ? 'VIDEO' : 'ẢNH'}</span>
                  </div>
                  <div className="product-media-actions">
                    <button
                      className={item.primary ? 'is-primary' : ''}
                      disabled={submitting}
                      onClick={() => setPrimary(item.key)}
                      title="Chọn làm media chính"
                      type="button"
                    >
                      {item.primary ? <StarFilled /> : <StarOutlined />}
                    </button>
                    <button disabled={submitting || index === 0} onClick={() => moveMedia(index, -1)} title="Đưa lên" type="button">
                      <ArrowUpOutlined />
                    </button>
                    <button disabled={submitting || index === mediaDrafts.length - 1} onClick={() => moveMedia(index, 1)} title="Đưa xuống" type="button">
                      <ArrowDownOutlined />
                    </button>
                    <button className="is-danger" disabled={submitting} onClick={() => removeMedia(item.key)} title="Xóa" type="button">
                      <DeleteOutlined />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </Form>
    </Modal>
  )
}
