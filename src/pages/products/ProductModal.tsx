import { useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Select, Checkbox, Row, Col } from 'antd'
import type { Product, MarketplaceType } from '../../types/product'

interface ProductModalProps {
  open: boolean
  product: Product | null
  onCancel: () => void
  onSave: (values: Partial<Product>) => void
}

export default function ProductModal({ open, product, onCancel, onSave }: ProductModalProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (product) {
      form.setFieldsValue({
        code: product.code,
        name: product.name,
        category: product.category,
        imageUrl: product.imageUrl,
        price: product.price,
        costPrice: product.costPrice,
        totalStock: product.totalStock,
        marketplaces: product.marketplaces,
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        marketplaces: ['TikTok Shop', 'Lazada'],
        totalStock: 50,
      })
    }
  }, [product, open, form])

  const handleFinish = (values: any) => {
    onSave(values)
    form.resetFields()
  }

  return (
    <Modal
      title={product ? 'Sửa thông tin sản phẩm' : 'Thêm mới sản phẩm'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={product ? 'Cập nhật' : 'Tạo mới'}
      cancelText="Hủy"
      width={700}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              name="name"
              label="Tên sản phẩm"
              rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
            >
              <Input placeholder="Ví dụ: Áo khoác denim nam dáng rộng AK-204" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="code"
              label="Mã SKU gốc"
              rules={[{ required: true, message: 'Vui lòng nhập mã SKU' }]}
            >
              <Input placeholder="DNM-OUT-AK204" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="category" label="Danh mục sản phẩm" initialValue="ÁO KHOÁC / OUTERWEAR">
              <Select>
                <Select.Option value="ÁO KHOÁC / OUTERWEAR">ÁO KHOÁC / OUTERWEAR</Select.Option>
                <Select.Option value="QUẦN JEAN / DENIM">QUẦN JEAN / DENIM</Select.Option>
                <Select.Option value="ÁO THUN & POLO">ÁO THUN & POLO</Select.Option>
                <Select.Option value="PHỤ KIỆN / GIÀY DÉP">PHỤ KIỆN / GIÀY DÉP</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="imageUrl" label="Link hình ảnh (URL)">
              <Input placeholder="https://..." />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="price"
              label="Giá bán lẻ (VNĐ)"
              rules={[{ required: true, message: 'Nhập giá bán' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(val) => val?.replace(/\$\s?|(,*)/g, '') as any}
                placeholder="489000"
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="costPrice" label="Giá vốn (VNĐ)">
              <InputNumber
                style={{ width: '100%' }}
                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(val) => val?.replace(/\$\s?|(,*)/g, '') as any}
                placeholder="280000"
              />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="totalStock" label="Tổng tồn kho">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="100" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="marketplaces" label="Sàn thương mại điện tử liên kết">
          <Checkbox.Group options={['TikTok Shop', 'Lazada'] as MarketplaceType[]} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
