export const conversations = [
  {
    id: 1,
    initials: 'NTM',
    name: 'Nguyễn Thị Mai',
    message: 'Size L còn không shop? Mình cần gấp lắm ạ',
    time: '2m',
    unread: 1,
    tags: ['VIP', 'Return risk'],
    active: true,
    tone: 'pink' as const,
  },
  {
    id: 2,
    initials: 'TVH',
    name: 'Trần Văn Hùng',
    message: 'Cho mình xin mã giảm giá freeship nhé',
    time: '8m',
    unread: 1,
    tags: ['Inquiry'],
    tone: 'orange' as const,
  },
]

export const customer = {
  initials: 'NTM',
  name: 'Nguyễn Thị Mai',
  channel: 'TikTok Shop',
  memberLevel: 'Platinum Member',
  joinedAt: 'Khách hàng từ Jan 2022',
  phone: '+84 90 123 4567',
  email: 'mai.nguyen@email.com',
  address: 'Ho Chi Minh City, VN',
  stats: [
    { label: 'Tổng chi tiêu', value: '18.420.000đ' },
    { label: 'Đơn hoàn tất', value: '27 đơn' },
  ],
  insights: [
    'Thường mua sắm trong khung 20:00 - 22:00',
    'Nhạy với giá, phản hồi tốt với mã giảm giá',
    'Tương tác cao với nhóm thời trang và áo khoác',
  ],
}

export const recommendations = [
  { name: 'Quần jeans slim fit...', price: '359.000đ', dark: false },
  { name: 'Áo len trơn basic A...', price: '249.000đ', dark: true },
]

export const orderHistory = [
  {
    id: 'DH-2401',
    date: '22/07/2026',
    status: 'Hoàn tất',
    total: '689.000đ',
    channel: 'TikTok Shop',
    items: 'Áo khoác denim AK-204, mũ basic',
  },
  {
    id: 'DH-2318',
    date: '14/06/2026',
    status: 'Hoàn tất',
    total: '359.000đ',
    channel: 'Lazada',
    items: 'Quần jeans slim fit',
  },
  {
    id: 'DH-2267',
    date: '28/05/2026',
    status: 'Đã hoàn',
    total: '249.000đ',
    channel: 'TikTok Shop',
    items: 'Áo len trơn basic',
  },
  {
    id: 'DH-2195',
    date: '09/04/2026',
    status: 'Hoàn tất',
    total: '1.120.000đ',
    channel: 'Lazada',
    items: 'Combo áo khoác, quần denim',
  },
  {
    id: 'DH-2082',
    date: '17/03/2026',
    status: 'Hoàn tất',
    total: '499.000đ',
    channel: 'TikTok Shop',
    items: 'Áo hoodie oversize',
  },
]
