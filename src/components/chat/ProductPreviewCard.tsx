export default function ProductPreviewCard() {
  return (
    <article className="chat-product-card">
      <div className="chat-product-photo">
        <span>Sản phẩm đang xem</span>
      </div>
      <div className="chat-product-info">
        <strong>Áo khoác denim nam AK-204</strong>
        <p>Phân loại: Size L - Xanh denim</p>
        <div>
          <span className="chat-price">489.000đ</span>
          <span className="chat-old-price">599.000đ</span>
          <span className="chat-discount">-18%</span>
        </div>
        <div className="chat-rating">4.8 | 1.240 đã bán</div>
      </div>
    </article>
  )
}
