import {
  CommentOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/authContext'
import { ROUTES } from '../../routes/paths'
import './landing.css'

interface Message {
  id: number
  sender: 'customer' | 'assistant' | 'user'
  text: string
  type: 'text' | 'product'
  product?: {
    name: string
    price: string
  }
}

export default function LandingScreen() {
  const { session } = useAuth()

  useEffect(() => {
    document.title = 'Omnichannel'
  }, [])

  // Messages state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'customer',
      text: 'Shop tư vấn giúp mình nhé, shop bảo hành Macbook M3 Pro thế nào?',
      type: 'text',
    },
    {
      id: 2,
      sender: 'customer',
      text: '',
      type: 'product',
      product: {
        name: 'Macbook Pro M3 Premium',
        price: '39.500.000đ',
      },
    },
  ])

  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom helper
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Suggested responses
  const suggestions = [
    {
      text: '🛡️ Tư vấn bảo hành',
      reply: 'Dạ, dòng Macbook Pro M3 bên em được bảo hành chính hãng 12 tháng tại các trung tâm ủy quyền Apple Việt Nam. Đặc biệt, SmartHub hỗ trợ chính sách 1-đổi-1 trong vòng 30 ngày đầu nếu phát sinh lỗi từ nhà sản xuất ạ!',
    },
    {
      text: '💳 Thanh toán qua QR',
      reply: 'Dạ, anh/chị có thể thanh toán chuyển khoản cực nhanh qua VietQR. Hệ thống SmartHub sẽ tự động tạo mã QR động kèm số tiền và nội dung chuyển khoản chính xác, giúp duyệt đơn tự động sau 3 giây ạ!',
    },
    {
      text: '🙋 Gặp nhân viên',
      reply: 'Dạ vâng ạ, em đã chuyển luồng chat này sang nhân viên trực hỗ trợ. Bạn Tuấn Anh sẽ liên hệ hỗ trợ mình ngay trong 1 phút tới ạ!',
    },
  ]

  // Handle suggestion click
  const handleSuggestionClick = (reply: string) => {
    if (isTyping) return
    setIsTyping(true)

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'assistant',
          text: reply,
          type: 'text',
        },
      ])
      setIsTyping(false)
    }, 1000)
  }

  // Handle typing custom message
  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isTyping) return

    const userText = inputText
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        text: userText,
        type: 'text',
      },
    ])
    setInputText('')
    setIsTyping(true)

    // AI automatic reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: `Dạ, trợ lý AI SmartHub đã nhận được thông tin: "${userText}". Em đang kết nối dữ liệu tồn kho và kịch bản CSKH để phản hồi anh/chị tốt nhất ạ!`,
          type: 'text',
        },
      ])
      setIsTyping(false)
    }, 1200)
  }

  return (
    <div className="landing-page-wrapper">
      <div className="dna-glow-bg" aria-hidden="true" />
      
      <div className="landing-content">
        
        {/* Header */}
        <header className="landing-header">
          <div className="landing-logo">
            <span className="landing-logo-mark">
              <CommentOutlined style={{ color: '#fff', fontSize: '16px' }} />
            </span>
            <span>SmartHub</span>
          </div>
          <nav className="landing-nav">
            <a href="#features" className="landing-nav-link">Tính năng</a>
            <a href="#demo" className="landing-nav-link">Giao diện thực tế</a>
            <a href="#pricing" className="landing-nav-link">Gói dịch vụ</a>
          </nav>
          <div className="landing-actions">
            {session ? (
              <Link to={ROUTES.overview} className="btn-trial">Vào trang quản trị</Link>
            ) : (
              <>
                <Link to={ROUTES.login} className="btn-signin">Đăng nhập</Link>
                <Link to={ROUTES.login} className="btn-trial">Thử nghiệm ngay</Link>
              </>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="landing-hero">
          <span className="hero-badge">
            ✨ TRỢ LÝ CRM VÀ NĂNG LƯỢNG HỢP NHẤT AI TIÊN TIẾN NHẤT
          </span>
          <h1 className="hero-title">
            Vận hành kinh doanh đa sàn
            <span>Đột phá cùng trợ lý AI</span>
          </h1>
          <p className="hero-subtitle">
            Hợp nhất toàn bộ tin nhắn, dữ liệu khách hàng và hệ thống tồn kho từ Shopee,
            Lazada, TikTok Shop, Zalo về một nền tảng duy nhất. Tự động hóa quy trình
            phản hồi và chốt đơn siêu tốc.
          </p>
          <div className="hero-buttons">
            {session ? (
              <Link to={ROUTES.overview} className="btn-primary">Vào trang quản trị</Link>
            ) : (
              <Link to={ROUTES.login} className="btn-primary">Bắt đầu hoàn toàn miễn phí</Link>
            )}
            <a href="#features" className="btn-secondary">Khám phá tính năng</a>
          </div>
        </section>

        {/* Chat Mockup Window Demo */}
        <section id="demo" className="chat-mockup-wrapper">
          <div className="chat-mockup-window">
            
            {/* macOS window title bar */}
            <div className="mockup-window-header">
              <div className="mockup-controls">
                <span className="mockup-dot red" />
                <span className="mockup-dot yellow" />
                <span className="mockup-dot green" />
              </div>
              <div className="mockup-address-bar">
                app.smarthub.vn/omnichannel/chat
              </div>
            </div>

            {/* Inner Workspace */}
            <div className="mockup-workspace">
              
              {/* Column 1: Conversations */}
              <div className="mockup-channels-sidebar">
                <div className="mockup-search-box">🔍 Tìm kiếm, số điện thoại...</div>
                <div className="mockup-tabs">
                  <span className="mockup-tab active">Tất cả</span>
                  <span className="mockup-tab">Shopee</span>
                  <span className="mockup-tab">TikTok</span>
                </div>
                <div className="mockup-chat-list">
                  <div className="mockup-chat-item active">
                    <div className="mockup-avatar">MH</div>
                    <div className="mockup-chat-details">
                      <span className="mockup-chat-name">Minh Hoàng</span>
                      <span className="mockup-chat-preview-text">Shop tư vấn giúp mình nhé...</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Chat workspace */}
              <div className="mockup-chat-area">
                <div className="mockup-chat-header">
                  <div className="mockup-chat-title-info">
                    <span className="mockup-chat-name">Minh Hoàng</span>
                    <span className="mockup-status-dot" />
                    <span className="mockup-status-text">Trực tuyến</span>
                  </div>
                  <div className="mockup-assignee-dropdown">
                    Giao việc: Tuấn Anh ▾
                  </div>
                </div>

                {/* Messages stream */}
                <div className="mockup-chat-messages">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`mockup-message ${
                        msg.sender === 'customer' ? 'incoming' : 'outgoing'
                      }`}
                    >
                      {msg.type === 'text' ? (
                        <div className="mockup-message-bubble">{msg.text}</div>
                      ) : (
                        <div className="mockup-message-product">
                          <div className="product-thumb-placeholder">💻</div>
                          <div className="product-info-mini">
                            <span className="product-title-mini">{msg.product?.name}</span>
                            <span className="product-price-mini">{msg.product?.price}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="mockup-message incoming">
                      <div className="typing-indicator" aria-label="AI Co-pilot đang soạn thảo">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Interactive Suggestion Chips */}
                <div className="mockup-suggestions-container">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      className="suggestion-chip"
                      onClick={() => handleSuggestionClick(sug.reply)}
                      type="button"
                    >
                      <span className="suggestion-chip-ai-icon">✨</span>
                      {sug.text}
                    </button>
                  ))}
                </div>

                {/* Input Bar */}
                <form className="mockup-chat-input-bar" onSubmit={handleSendMessage}>
                  <input
                    className="mockup-input-box"
                    placeholder="Nhập nội dung tin nhắn tại đây..."
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <button className="mockup-send-btn" type="submit" aria-label="Gửi tin nhắn">
                    <SendOutlined style={{ fontSize: '10px' }} />
                  </button>
                </form>
              </div>

              {/* Column 3: CRM Details */}
              <div className="mockup-profile-sidebar">
                <div>
                  <h3 className="profile-section-title">Hồ sơ khách hàng (CRM)</h3>
                  <div className="profile-card-details">
                    <div className="profile-detail-row">Họ và tên: <span>Nguyễn Minh Hoàng</span></div>
                    <div className="profile-detail-row">Số ĐT: <span>0912.xxx.xxx</span></div>
                  </div>
                </div>

                <div className="ai-insights-box">
                  <div className="ai-insights-title">✨ AI Insights</div>
                  Thường mua sản phẩm công nghệ &gt; 30 triệu. Nhạy cảm về giá trị bảo hành. Thích giao hàng hỏa tốc.
                </div>

                <div>
                  <h3 className="profile-section-title">Lịch sử mua hàng</h3>
                  <div className="purchase-history-item">
                    <span className="history-item-name">Macbook M3 Pro</span>
                    <span className="history-item-status">Đã nhận</span>
                  </div>
                </div>

                <button className="btn-link-order" type="button">
                  + Liên kết đơn siêu tốc
                </button>
              </div>

            </div>

          </div>
        </section>

        {/* Ecosystem Grid Section */}
        <section id="features" className="overview-ecosystem">
          <div>
            <h2 className="ecosystem-title">Hệ sinh thái quản trị cốt lõi</h2>
            <p className="ecosystem-subtitle">
              Ứng dụng cấu trúc đồ thị dữ liệu thông minh kết hợp với sức mạnh từ AI giúp vận hành nhẹ nhàng, chính xác.
            </p>
          </div>

          <div className="ecosystem-grid">
            
            {/* Card 1 */}
            <div className="ecosystem-card">
              <div className="ecosystem-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h3 className="ecosystem-card-title">Hộp thư Omnichannel thông minh</h3>
              <p className="ecosystem-card-desc">
                Không còn tình trạng chạy qua chạy lại giữa Shopee, Zalo, TikTok Shop để trả lời tin nhắn. 
                Hệ thống gom toàn bộ tin nhắn đa kênh thời gian thực giúp tối đa hóa năng suất xử lý của nhân viên trực chat gấp 3 lần.
              </p>
            </div>

            {/* Card 2 */}
            <div className="ecosystem-card">
              <div className="ecosystem-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a10 10 0 0 1 10 10c0 5.5-4.5 10-10 10S2 17.5 2 12A10 10 0 0 1 12 2z"/>
                  <path d="M12 8v8"/>
                  <path d="M8 12h8"/>
                </svg>
              </div>
              <h3 className="ecosystem-card-title">AI Co-pilot tự học</h3>
              <p className="ecosystem-card-desc">
                Đọc hiểu lịch sử trò chuyện và dữ liệu sản phẩm để đưa ra gợi ý kịch bản tư vấn phù hợp nhất. 
                Tự động sửa lỗi chính tả và tối ưu hóa thời gian điều phối sales.
              </p>
            </div>

            {/* Card 3 */}
            <div className="ecosystem-card">
              <div className="ecosystem-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="21 8 21 21 3 21 3 8"/>
                  <rect x="1" y="3" width="22" height="5"/>
                  <line x1="10" y1="12" x2="14" y2="12"/>
                </svg>
              </div>
              <h3 className="ecosystem-card-title">Đồng bộ kho thực tế</h3>
              <p className="ecosystem-card-desc">
                Mọi biến động từ kho vật lý sẽ tự động đồng bộ trở lại số lượng khả dụng trên các gian hàng thương mại điện tử ngay lập tức, 
                triệt tiêu rủi ro vượt bán.
              </p>
            </div>

            {/* Card 4 */}
            <div className="ecosystem-card">
              <div className="ecosystem-card-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="5" r="3"/>
                  <circle cx="5" cy="19" r="3"/>
                  <circle cx="19" cy="19" r="3"/>
                  <line x1="12" y1="8" x2="19" y2="16"/>
                  <line x1="12" y1="8" x2="5" y2="16"/>
                </svg>
              </div>
              <h3 className="ecosystem-card-title">Mạng lưới phân tích Customer DNA</h3>
              <p className="ecosystem-card-desc">
                Thiết lập hệ thống sơ đồ mạng lưới kết nối thông tin khách hàng, thói quen tiêu dùng và sở thích cá nhân. 
                Tạo ra phễu chăm sóc tự động hoàn hảo, giữ chân khách hàng cũ trọn đời.
              </p>
            </div>

          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="landing-pricing">
          <div>
            <h2 className="pricing-title">Gói dịch vụ linh hoạt</h2>
            <p className="pricing-subtitle">
              Lựa chọn gói dịch vụ phù hợp nhất để tối ưu hóa quy trình vận hành và bứt phá doanh số cùng AI.
            </p>
          </div>

          <div className="pricing-grid">
            {/* Plan 1 */}
            <div className="pricing-card">
              <h3 className="pricing-plan-name">Gói Starter</h3>
              <p className="pricing-plan-desc">Giải pháp cơ bản cho cá nhân mới bắt đầu kinh doanh.</p>
              <div className="pricing-price-wrapper">
                <span className="pricing-price">0đ</span>
                <span className="pricing-period">/ trọn đời</span>
              </div>
              <ul className="pricing-features-list">
                <li className="pricing-feature-item"><span className="feature-check-icon">✓</span> Kết nối tối đa 2 gian hàng (Shopee, Lazada)</li>
                <li className="pricing-feature-item"><span className="feature-check-icon">✓</span> Đồng bộ tối đa 100 đơn hàng/tháng</li>
                <li className="pricing-feature-item"><span className="feature-check-icon">✓</span> Trợ lý AI Co-pilot soạn tin nhắn cơ bản</li>
                <li className="pricing-feature-item"><span className="feature-check-icon">✓</span> Báo cáo thống kê đơn hàng cơ bản</li>
              </ul>
              <Link to={ROUTES.login} className="btn-pricing-action">Bắt đầu ngay</Link>
            </div>

            {/* Plan 2 */}
            <div className="pricing-card popular">
              <span className="popular-badge">PHỔ BIẾN</span>
              <h3 className="pricing-plan-name">Gói Growth</h3>
              <p className="pricing-plan-desc">Tối ưu hóa năng suất và bứt phá doanh số cho shop tăng trưởng nhanh.</p>
              <div className="pricing-price-wrapper">
                <span className="pricing-price">399.000đ</span>
                <span className="pricing-period">/ tháng</span>
              </div>
              <ul className="pricing-features-list">
                <li className="pricing-feature-item"><span className="feature-check-icon">✓</span> Kết nối không giới hạn gian hàng đa kênh</li>
                <li className="pricing-feature-item"><span className="feature-check-icon">✓</span> Đồng bộ tồn kho & đơn hàng thời gian thực</li>
                <li className="pricing-feature-item"><span className="feature-check-icon">✓</span> AI Co-pilot tự học kịch bản trả lời tự động</li>
                <li className="pricing-feature-item"><span className="feature-check-icon">✓</span> Mạng lưới Customer DNA (Phân tích CRM chuyên sâu)</li>
                <li className="pricing-feature-item"><span className="feature-check-icon">✓</span> Hỗ trợ ưu tiên trực tuyến 24/7</li>
              </ul>
              <Link to={ROUTES.login} className="btn-pricing-action">Thử nghiệm 7 ngày miễn phí</Link>
            </div>

            {/* Plan 3 */}
            <div className="pricing-card">
              <h3 className="pricing-plan-name">Gói Enterprise</h3>
              <p className="pricing-plan-desc">Thiết kế riêng cho các thương hiệu lớn và chuỗi kho bãi phức tạp.</p>
              <div className="pricing-price-wrapper">
                <span className="pricing-price">Liên hệ</span>
              </div>
              <ul className="pricing-features-list">
                <li className="pricing-feature-item"><span className="feature-check-icon">✓</span> Toàn bộ tính năng của gói Growth</li>
                <li className="pricing-feature-item"><span className="feature-check-icon">✓</span> Tích hợp cổng API riêng biệt cho doanh nghiệp</li>
                <li className="pricing-feature-item"><span className="feature-check-icon">✓</span> Huấn luyện mô hình AI riêng trên tập dữ liệu shop</li>
                <li className="pricing-feature-item"><span className="feature-check-icon">✓</span> Hệ thống quản lý kho đa điểm vật lý</li>
                <li className="pricing-feature-item"><span className="feature-check-icon">✓</span> Triển khai kỹ thuật & hỗ trợ trực tiếp tận nơi</li>
              </ul>
              <Link to={ROUTES.login} className="btn-pricing-action">Liên hệ tư vấn</Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-brand">
            <span className="landing-logo-mark" style={{ padding: '4px 6px', borderRadius: '4px' }}>
              <CommentOutlined style={{ color: '#fff', fontSize: '10px' }} />
            </span>
            <span>SmartHub</span>
          </div>
          <div>
            © 2026 SmartHub Platform. Built with next-generation UI/UX engineering.
          </div>
        </footer>

      </div>
    </div>
  )
}
