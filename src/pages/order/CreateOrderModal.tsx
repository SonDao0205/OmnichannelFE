import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Form, Input, InputNumber, Modal, Select } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type { CreateOrderPayload } from '../../apis/orderApi'
import { productApi, productErrorMessage } from '../../apis/productApi'
import type { Product } from '../../types/product'

interface CreateOrderModalProps {
  open: boolean
  onCancel: () => void
  onCreate: (payload: CreateOrderPayload) => Promise<void>
}

interface ManualOrderForm {
  customerName: string
  customerPhone?: string
  fullAddress: string
  district?: string
  city: string
  paymentStatus: 'UNPAID' | 'PAID'
  discountAmount: number
  items: Array<{
    variantId: string
    productName: string
    sku: string
    variantName: string
    price: number
    quantity: number
  }>
}

export default function CreateOrderModal({ open, onCancel, onCreate }: CreateOrderModalProps) {
  const [form] = Form.useForm<ManualOrderForm>()
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const watchedItems = Form.useWatch('items', form) ?? []

  useEffect(() => {
    if (!open) return
    form.resetFields()
    form.setFieldsValue({
      paymentStatus: 'UNPAID',
      discountAmount: 0,
      items: [{ quantity: 1, price: 0 } as ManualOrderForm['items'][number]],
    })
    const timer = window.setTimeout(async () => {
      setServerError('')
      setLoadingProducts(true)
      try {
        setProducts(await productApi.fetchAllProducts())
      } catch (error) {
        setServerError(productErrorMessage(error))
      } finally {
        setLoadingProducts(false)
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [form, open])

  const variantOptions = useMemo(() => products.flatMap(product =>
    product.variants.map(variant => ({
      value: variant.id,
      label: `${product.name} — ${variant.sku} — tồn ${variant.stock}`,
      disabled: variant.stock <= 0,
      product,
      variant,
    })),
  ), [products])

  const subtotal = watchedItems.reduce((sum, item) =>
    sum + Math.max(0, Number(item?.price) || 0) * Math.max(0, Number(item?.quantity) || 0), 0)
  const discount = Number(Form.useWatch('discountAmount', form)) || 0
  const finalAmount = Math.max(0, subtotal - discount)

  function selectVariant(index: number, variantId: string) {
    const option = variantOptions.find(item => item.value === variantId)
    if (!option) return
    const items = [...(form.getFieldValue('items') ?? [])]
    items[index] = {
      ...items[index],
      variantId,
      productName: option.product.name,
      sku: option.variant.sku,
      variantName: option.variant.name,
      price: option.variant.price,
      quantity: items[index]?.quantity || 1,
    }
    form.setFieldsValue({ items })
    void form.validateFields([['items', index]])
  }

  async function submit(values: ManualOrderForm) {
    setSubmitting(true)
    setServerError('')
    try {
      await onCreate({
        customerName: values.customerName.trim(),
        customerPhone: values.customerPhone?.trim(),
        marketplace: 'MANUAL',
        paymentStatus: values.paymentStatus,
        discountAmount: values.discountAmount || 0,
        shippingAddressJson: JSON.stringify({
          recipientName: values.customerName.trim(),
          phoneNumber: values.customerPhone?.trim() || '',
          fullAddress: values.fullAddress.trim(),
          district: values.district?.trim() || '',
          city: values.city.trim(),
        }),
        items: values.items.map(item => ({
          productName: item.productName,
          sku: item.sku,
          variantName: item.variantName,
          price: item.price,
          quantity: item.quantity,
        })),
      })
      form.resetFields()
    } catch (error) {
      setServerError(productErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      cancelText="Hủy"
      confirmLoading={submitting}
      destroyOnHidden
      okText="Tạo đơn"
      onCancel={onCancel}
      onOk={() => form.submit()}
      open={open}
      title="Tạo đơn hàng thủ công"
      width={820}
    >
      <Form
        className="manual-order-form"
        form={form}
        layout="vertical"
        onFinish={values => void submit(values)}
        validateTrigger={['onChange', 'onBlur']}
      >
        {serverError && <div className="manual-order-error" role="alert">{serverError}</div>}
        <div className="manual-order-grid">
          <Form.Item label="Tên khách hàng" name="customerName" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên khách hàng.' }, { max: 255, message: 'Tên khách hàng tối đa 255 ký tự.' }]}>
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item label="Số điện thoại" name="customerPhone" rules={[{ pattern: /^(?:\+84|0)[0-9]{9,10}$/, message: 'Số điện thoại không đúng định dạng.' }]}>
            <Input placeholder="0901234567" />
          </Form.Item>
          <Form.Item className="manual-order-wide" label="Địa chỉ giao hàng" name="fullAddress" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập địa chỉ giao hàng.' }]}>
            <Input placeholder="Số nhà, tên đường, phường/xã" />
          </Form.Item>
          <Form.Item label="Quận / Huyện" name="district">
            <Input placeholder="Quận 1" />
          </Form.Item>
          <Form.Item label="Tỉnh / Thành phố" name="city" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tỉnh/thành phố.' }]}>
            <Input placeholder="TP. Hồ Chí Minh" />
          </Form.Item>
          <Form.Item label="Thanh toán" name="paymentStatus" rules={[{ required: true, message: 'Vui lòng chọn trạng thái thanh toán.' }]}>
            <Select options={[{ value: 'UNPAID', label: 'COD / Chưa thanh toán' }, { value: 'PAID', label: 'Đã thanh toán' }]} />
          </Form.Item>
          <Form.Item label="Giảm giá" name="discountAmount" rules={[{ type: 'number', min: 0, message: 'Giảm giá không được âm.' }, { validator: (_, value) => Number(value || 0) <= subtotal ? Promise.resolve() : Promise.reject(new Error('Giảm giá không được lớn hơn tiền hàng.')) }]}>
            <InputNumber min={0} precision={0} addonAfter="₫" style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <div className="manual-order-section-title">Sản phẩm trong đơn</div>
        <Form.List name="items" rules={[{ validator: async (_, items) => { if (!items?.length) throw new Error('Đơn hàng phải có ít nhất một sản phẩm.') } }]}>
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map((field, index) => (
                <div className="manual-order-item" key={field.key}>
                  <Form.Item hidden name={[field.name, 'productName']}><Input /></Form.Item>
                  <Form.Item hidden name={[field.name, 'sku']}><Input /></Form.Item>
                  <Form.Item hidden name={[field.name, 'variantName']}><Input /></Form.Item>
                  <Form.Item className="manual-order-product" label={index === 0 ? 'Sản phẩm / SKU' : ''} name={[field.name, 'variantId']} rules={[{ required: true, message: 'Vui lòng chọn sản phẩm.' }]}>
                    <Select loading={loadingProducts} showSearch optionFilterProp="label" placeholder="Chọn sản phẩm và SKU" options={variantOptions.map(({ value, label, disabled }) => ({ value, label, disabled }))} onChange={value => selectVariant(index, value)} />
                  </Form.Item>
                  <Form.Item label={index === 0 ? 'Đơn giá' : ''} name={[field.name, 'price']} rules={[{ required: true, message: 'Nhập đơn giá.' }, { type: 'number', min: 0, message: 'Đơn giá không được âm.' }]}>
                    <InputNumber min={0} precision={0} addonAfter="₫" />
                  </Form.Item>
                  <Form.Item label={index === 0 ? 'Số lượng' : ''} name={[field.name, 'quantity']} rules={[{ required: true, message: 'Nhập số lượng.' }, { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0.' }, { validator: (_, value) => { const variantId = form.getFieldValue(['items', field.name, 'variantId']); const option = variantOptions.find(item => item.value === variantId); return !option || Number(value || 0) <= option.variant.stock ? Promise.resolve() : Promise.reject(new Error(`Tồn kho chỉ còn ${option.variant.stock}.`)) } }]}>
                    <InputNumber min={1} precision={0} />
                  </Form.Item>
                  <button aria-label="Xóa sản phẩm" className="manual-order-remove" disabled={fields.length === 1} onClick={() => remove(field.name)} type="button"><DeleteOutlined /></button>
                </div>
              ))}
              <Form.ErrorList errors={errors} />
              <button className="manual-order-add" onClick={() => add({ quantity: 1, price: 0 })} type="button"><PlusOutlined /> Thêm sản phẩm</button>
            </>
          )}
        </Form.List>

        <div className="manual-order-totals">
          <span>Tiền hàng <strong>{subtotal.toLocaleString('vi-VN')}₫</strong></span>
          <span>Giảm giá <strong>-{discount.toLocaleString('vi-VN')}₫</strong></span>
          <span className="total">Khách phải trả <strong>{finalAmount.toLocaleString('vi-VN')}₫</strong></span>
        </div>
      </Form>
    </Modal>
  )
}
