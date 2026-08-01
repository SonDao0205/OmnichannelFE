import type ExcelJS from 'exceljs'
import type { Order } from '../types/order'

const BLUE = '2563EB'
const DARK = '0F172A'
const LIGHT_BLUE = 'EFF6FF'
const LIGHT_BORDER = 'DCE3ED'
const WHITE = 'FFFFFF'
const GREEN = '059669'
const ORANGE = 'D97706'
const RED = 'DC2626'

export interface WarehouseExportProduct {
  name: string
  category: string
  costPrice: number
  quantity: number
  minStock: number
  maxStock: number
  status: 'LOW' | 'NORMAL' | 'OVERSTOCK'
  variants: Array<{
    sku: string
    name: string
    price: number
    stock: number
  }>
}

export interface SalesExportReport {
  rangeLabel: string
  revenue: number
  successful: number
  aov: number
  conversion: number
  orders: Order[]
  trend: Array<{ label: string; revenue: number; profit: number }>
  channels: Array<{ name: string; value: number }>
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
}

export interface ShipmentExportRecord {
  id: string
  orderId: string | null
  waybillCode: string
  carrierName: string
  destination: string
  codAmount: number
  latestMilestone: string
  milestoneType: 'waiting' | 'picked' | 'transit' | 'success' | 'failed'
  shippedAt: string | null
  deliveredAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ShipmentExportOptions {
  search?: string
}

function applyTitle(sheet: ExcelJS.Worksheet, title: string, subtitle: string, lastColumn: string) {
  sheet.mergeCells(`A1:${lastColumn}2`)
  const titleCell = sheet.getCell('A1')
  titleCell.value = title
  titleCell.font = { name: 'Aptos Display', size: 20, bold: true, color: { argb: WHITE } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' }
  sheet.getRow(1).height = 28
  sheet.getRow(2).height = 14
  sheet.mergeCells(`A3:${lastColumn}3`)
  const subtitleCell = sheet.getCell('A3')
  subtitleCell.value = subtitle
  subtitleCell.font = { name: 'Aptos', size: 10, color: { argb: '64748B' } }
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'left' }
  sheet.getRow(3).height = 22
  sheet.views = [{ state: 'frozen', ySplit: 4, showGridLines: false }]
  sheet.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
  }
}

function styleTableHeader(row: ExcelJS.Row) {
  row.height = 24
  row.eachCell(cell => {
    cell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: WHITE } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = { bottom: { style: 'medium', color: { argb: '1D4ED8' } } }
  })
}

function styleDataRows(sheet: ExcelJS.Worksheet, startRow: number, endRow: number) {
  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber)
    row.height = 21
    row.eachCell(cell => {
      cell.font = { name: 'Aptos', size: 10, color: { argb: '334155' } }
      cell.alignment = { vertical: 'middle' }
      cell.border = { bottom: { style: 'thin', color: { argb: LIGHT_BORDER } } }
      if (rowNumber % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } }
      }
    })
  }
}

function styleKpi(cell: ExcelJS.Cell, label: string, value: number, numberFormat: string, color: string) {
  const formattedValue = numberFormat.includes('%')
    ? `${value.toFixed(2)}%`
    : `${value.toLocaleString('vi-VN')}${numberFormat.includes('₫') ? ' ₫' : ''}`
  cell.value = { richText: [
    { text: `${label}\n`, font: { name: 'Aptos', size: 9, bold: true, color: { argb: '64748B' } } },
    { text: formattedValue, font: { name: 'Aptos Display', size: 17, bold: true, color: { argb: color } } },
  ] }
  cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } }
  cell.border = {
    top: { style: 'thin', color: { argb: LIGHT_BORDER } },
    left: { style: 'thin', color: { argb: LIGHT_BORDER } },
    bottom: { style: 'thin', color: { argb: LIGHT_BORDER } },
    right: { style: 'thin', color: { argb: LIGHT_BORDER } },
  }
}

async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer()
  const bytes = new Uint8Array(buffer)
  const url = URL.createObjectURL(new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportWarehouseExcel(products: WarehouseExportProduct[]) {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Omnichannel Management'
  workbook.company = 'SMART HUB'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.title = 'Báo cáo tồn kho'
  workbook.subject = 'Dữ liệu tồn kho theo SKU'

  const summary = workbook.addWorksheet('Tổng quan kho', { properties: { tabColor: { argb: BLUE } } })
  applyTitle(summary, 'BÁO CÁO TỒN KHO', `Xuất lúc ${new Date().toLocaleString('vi-VN')} • Dữ liệu từ hệ thống`, 'H')
  summary.mergeCells('A5:B7')
  summary.mergeCells('C5:D7')
  summary.mergeCells('E5:F7')
  summary.mergeCells('G5:H7')
  const totalSku = products.reduce((sum, product) => sum + product.variants.length, 0)
  const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0)
  const totalValue = products.reduce((sum, product) => sum + product.costPrice * product.quantity, 0)
  const lowStock = products.filter(product => product.status === 'LOW').length
  styleKpi(summary.getCell('A5'), 'SẢN PHẨM', products.length, '#,##0', DARK)
  styleKpi(summary.getCell('C5'), 'TỔNG SKU', totalSku, '#,##0', BLUE)
  styleKpi(summary.getCell('E5'), 'TỔNG TỒN', totalQuantity, '#,##0', GREEN)
  styleKpi(summary.getCell('G5'), 'SẮP HẾT HÀNG', lowStock, '#,##0', RED)
  summary.mergeCells('A9:H9')
  summary.getCell('A9').value = `Tổng giá trị tồn kho: ${totalValue.toLocaleString('vi-VN')} VNĐ`
  summary.getCell('A9').font = { name: 'Aptos Display', size: 14, bold: true, color: { argb: DARK } }
  summary.getCell('A9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } }
  summary.getCell('A9').alignment = { vertical: 'middle', horizontal: 'center' }
  summary.getRow(9).height = 28
  summary.columns = Array.from({ length: 8 }, () => ({ width: 16 }))

  const detail = workbook.addWorksheet('Chi tiết SKU', { properties: { tabColor: { argb: GREEN } } })
  applyTitle(detail, 'CHI TIẾT TỒN KHO THEO SKU', `Tổng ${totalSku.toLocaleString('vi-VN')} SKU • ${products.length.toLocaleString('vi-VN')} sản phẩm`, 'K')
  const headers = ['STT', 'Sản phẩm', 'SKU', 'Phân loại', 'Danh mục', 'Giá vốn', 'Giá bán', 'Tồn SKU', 'Tổng tồn SP', 'Mức tối thiểu', 'Trạng thái']
  detail.addRow([])
  const headerRow = detail.addRow(headers)
  styleTableHeader(headerRow)
  let index = 1
  products.forEach(product => {
    const statusLabel = product.status === 'LOW' ? 'Sắp hết hàng' : product.status === 'OVERSTOCK' ? 'Vượt mức đề xuất' : 'Còn hàng an toàn'
    if (product.variants.length === 0) {
      detail.addRow([index, product.name, '', '', product.category, product.costPrice, 0, 0, product.quantity, product.minStock, statusLabel])
      index += 1
      return
    }
    product.variants.forEach(variant => {
      detail.addRow([index, product.name, variant.sku, variant.name, product.category, product.costPrice, variant.price, variant.stock, product.quantity, product.minStock, statusLabel])
      index += 1
    })
  })
  const detailEnd = Math.max(headerRow.number, detail.rowCount)
  styleDataRows(detail, headerRow.number + 1, detailEnd)
  detail.autoFilter = { from: `A${headerRow.number}`, to: `K${detailEnd}` }
  detail.views = [{ state: 'frozen', ySplit: headerRow.number, xSplit: 2, showGridLines: false }]
  detail.columns = [8, 32, 18, 22, 20, 16, 16, 12, 13, 14, 20].map(width => ({ width }))
  ;[6, 7].forEach(column => { detail.getColumn(column).numFmt = '#,##0 "₫"' })
  ;[1, 8, 9, 10].forEach(column => { detail.getColumn(column).alignment = { horizontal: 'center', vertical: 'middle' } })
  for (let rowNumber = headerRow.number + 1; rowNumber <= detailEnd; rowNumber += 1) {
    const statusCell = detail.getCell(rowNumber, 11)
    const color = statusCell.value === 'Sắp hết hàng' ? RED : statusCell.value === 'Vượt mức đề xuất' ? ORANGE : GREEN
    statusCell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: color } }
  }

  await downloadWorkbook(workbook, `bao-cao-kho-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export async function exportSalesExcel(report: SalesExportReport) {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Omnichannel Management'
  workbook.company = 'SMART HUB'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.title = 'Báo cáo doanh số'
  workbook.subject = report.rangeLabel

  const summary = workbook.addWorksheet('Tổng quan', { properties: { tabColor: { argb: BLUE } } })
  applyTitle(summary, 'BÁO CÁO DOANH SỐ', `${report.rangeLabel} • Xuất lúc ${new Date().toLocaleString('vi-VN')}`, 'H')
  summary.mergeCells('A5:B7')
  summary.mergeCells('C5:D7')
  summary.mergeCells('E5:F7')
  summary.mergeCells('G5:H7')
  styleKpi(summary.getCell('A5'), 'DOANH THU THUẦN', Math.round(report.revenue), '#,##0 "₫"', BLUE)
  styleKpi(summary.getCell('C5'), 'ĐƠN THÀNH CÔNG', report.successful, '#,##0', GREEN)
  styleKpi(summary.getCell('E5'), 'GIÁ TRỊ ĐƠN TB', Math.round(report.aov), '#,##0 "₫"', DARK)
  styleKpi(summary.getCell('G5'), 'TỶ LỆ CHUYỂN ĐỔI', report.conversion, '0.00%', ORANGE)

  summary.getCell('A10').value = 'XU HƯỚNG DOANH THU VÀ LỢI NHUẬN'
  summary.getCell('A10').font = { name: 'Aptos', size: 11, bold: true, color: { argb: DARK } }
  const trendHeader = summary.getRow(11)
  trendHeader.values = ['Giai đoạn', 'Doanh thu', 'Lợi nhuận']
  styleTableHeader(trendHeader)
  report.trend.forEach(point => summary.addRow([point.label, point.revenue, point.profit]))
  styleDataRows(summary, 12, 11 + report.trend.length)
  summary.getColumn(2).numFmt = '#,##0 "₫"'
  summary.getColumn(3).numFmt = '#,##0 "₫"'

  summary.getCell('E10').value = 'DOANH THU THEO KÊNH'
  summary.getCell('E10').font = { name: 'Aptos', size: 11, bold: true, color: { argb: DARK } }
  const channelHeader = summary.getRow(11)
  channelHeader.getCell(5).value = 'Kênh bán'
  channelHeader.getCell(6).value = 'Doanh thu'
  channelHeader.getCell(7).value = 'Tỷ trọng'
  ;[5, 6, 7].forEach(column => {
    const cell = channelHeader.getCell(column)
    cell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: WHITE } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })
  const channelTotal = report.channels.reduce((sum, channel) => sum + channel.value, 0)
  report.channels.forEach((channel, channelIndex) => {
    const row = summary.getRow(12 + channelIndex)
    row.getCell(5).value = channel.name
    row.getCell(6).value = channel.value
    row.getCell(7).value = channelTotal ? channel.value / channelTotal : 0
    row.getCell(6).numFmt = '#,##0 "₫"'
    row.getCell(7).numFmt = '0.0%'
  })

  const productStart = Math.max(18, 13 + Math.max(report.trend.length, report.channels.length))
  summary.getCell(`A${productStart}`).value = 'TOP SẢN PHẨM ĐÓNG GÓP DOANH SỐ'
  summary.getCell(`A${productStart}`).font = { name: 'Aptos', size: 11, bold: true, color: { argb: DARK } }
  const productHeader = summary.getRow(productStart + 1)
  productHeader.values = ['Hạng', 'Sản phẩm', 'Đã bán', 'Doanh số']
  styleTableHeader(productHeader)
  report.topProducts.forEach((product, productIndex) => summary.addRow([productIndex + 1, product.name, product.quantity, product.revenue]))
  styleDataRows(summary, productStart + 2, productStart + 1 + report.topProducts.length)
  summary.getColumn(4).numFmt = '#,##0 "₫"'
  summary.columns = [12, 24, 16, 18, 20, 18, 14, 14].map(width => ({ width }))

  const ordersSheet = workbook.addWorksheet('Đơn hàng', { properties: { tabColor: { argb: GREEN } } })
  applyTitle(ordersSheet, 'DỮ LIỆU ĐƠN HÀNG', `${report.orders.length.toLocaleString('vi-VN')} đơn trong kỳ báo cáo • Nguồn: database`, 'L')
  ordersSheet.addRow([])
  const orderHeader = ordersSheet.addRow(['STT', 'Ngày tạo', 'Mã đơn', 'Kênh bán', 'Khách hàng', 'Số điện thoại', 'Trạng thái', 'Thanh toán', 'Tiền hàng', 'Phí vận chuyển', 'Giảm giá', 'Tổng thanh toán'])
  styleTableHeader(orderHeader)
  report.orders.forEach((order, orderIndex) => {
    ordersSheet.addRow([orderIndex + 1, new Date(order.createdAt), order.orderCode, order.marketplace, order.customerName, order.customerPhone, order.status, order.paymentStatus, order.totalAmount, order.shippingFee, order.discountAmount, order.finalAmount])
  })
  const ordersEnd = Math.max(orderHeader.number, ordersSheet.rowCount)
  styleDataRows(ordersSheet, orderHeader.number + 1, ordersEnd)
  ordersSheet.autoFilter = { from: `A${orderHeader.number}`, to: `L${ordersEnd}` }
  ordersSheet.views = [{ state: 'frozen', ySplit: orderHeader.number, xSplit: 3, showGridLines: false }]
  ordersSheet.columns = [8, 14, 18, 16, 24, 16, 16, 16, 16, 16, 16, 18].map(width => ({ width }))
  ordersSheet.getColumn(2).numFmt = 'dd/mm/yyyy hh:mm'
  ;[9, 10, 11, 12].forEach(column => { ordersSheet.getColumn(column).numFmt = '#,##0 "₫"' })

  const itemsSheet = workbook.addWorksheet('Sản phẩm bán ra', { properties: { tabColor: { argb: ORANGE } } })
  applyTitle(itemsSheet, 'CHI TIẾT SẢN PHẨM BÁN RA', 'Chỉ bao gồm dữ liệu đơn hàng trong kỳ báo cáo', 'I')
  itemsSheet.addRow([])
  const itemHeader = itemsSheet.addRow(['STT', 'Mã đơn', 'Ngày tạo', 'Sản phẩm', 'SKU', 'Phân loại', 'Số lượng', 'Đơn giá', 'Thành tiền'])
  styleTableHeader(itemHeader)
  let itemIndex = 1
  report.orders.forEach(order => {
    order.items.forEach(item => {
      itemsSheet.addRow([itemIndex, order.orderCode, new Date(order.createdAt), item.productName, item.sku, item.variantName || '', item.quantity, item.price, item.quantity * item.price])
      itemIndex += 1
    })
  })
  const itemsEnd = Math.max(itemHeader.number, itemsSheet.rowCount)
  styleDataRows(itemsSheet, itemHeader.number + 1, itemsEnd)
  itemsSheet.autoFilter = { from: `A${itemHeader.number}`, to: `I${itemsEnd}` }
  itemsSheet.views = [{ state: 'frozen', ySplit: itemHeader.number, xSplit: 2, showGridLines: false }]
  itemsSheet.columns = [8, 18, 14, 34, 18, 22, 12, 16, 18].map(width => ({ width }))
  itemsSheet.getColumn(3).numFmt = 'dd/mm/yyyy'
  ;[8, 9].forEach(column => { itemsSheet.getColumn(column).numFmt = '#,##0 "₫"' })

  await downloadWorkbook(workbook, `bao-cao-doanh-so-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

const SHIPMENT_STATUS_LABELS: Record<ShipmentExportRecord['milestoneType'], string> = {
  waiting: 'Chờ lấy hàng',
  picked: 'Đã lấy hàng',
  transit: 'Đang giao hàng',
  success: 'Giao thành công',
  failed: 'Giao thất bại / hoàn hàng',
}

function excelDate(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date
}

export async function exportShipmentExcel(
  shipments: ShipmentExportRecord[],
  options: ShipmentExportOptions = {},
) {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Omnichannel Management'
  workbook.company = 'SMART HUB'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.title = 'Báo cáo vận chuyển'
  workbook.subject = options.search
    ? `Dữ liệu vận chuyển khớp từ khóa: ${options.search}`
    : 'Toàn bộ dữ liệu vận chuyển'

  const statusCounts = shipments.reduce<Record<ShipmentExportRecord['milestoneType'], number>>(
    (counts, shipment) => {
      counts[shipment.milestoneType] += 1
      return counts
    },
    { waiting: 0, picked: 0, transit: 0, success: 0, failed: 0 },
  )
  const totalCod = shipments.reduce((sum, shipment) => sum + Number(shipment.codAmount || 0), 0)
  const completed = statusCounts.success + statusCounts.failed
  const successRate = completed ? (statusCounts.success / completed) * 100 : 0
  const filterLabel = options.search ? `Từ khóa: “${options.search}”` : 'Phạm vi: toàn bộ vận đơn'

  const summary = workbook.addWorksheet('Tổng quan vận chuyển', { properties: { tabColor: { argb: BLUE } } })
  applyTitle(summary, 'BÁO CÁO VẬN CHUYỂN', `${filterLabel} • Xuất lúc ${new Date().toLocaleString('vi-VN')} • Nguồn: database`, 'J')
  summary.mergeCells('A5:B7')
  summary.mergeCells('C5:D7')
  summary.mergeCells('E5:F7')
  summary.mergeCells('G5:H7')
  summary.mergeCells('I5:J7')
  styleKpi(summary.getCell('A5'), 'TỔNG VẬN ĐƠN', shipments.length, '#,##0', DARK)
  styleKpi(summary.getCell('C5'), 'ĐANG GIAO', statusCounts.transit, '#,##0', BLUE)
  styleKpi(summary.getCell('E5'), 'GIAO THÀNH CÔNG', statusCounts.success, '#,##0', GREEN)
  styleKpi(summary.getCell('G5'), 'THẤT BẠI / HOÀN', statusCounts.failed, '#,##0', RED)
  styleKpi(summary.getCell('I5'), 'TỶ LỆ THÀNH CÔNG', successRate, '0.00%', ORANGE)

  summary.mergeCells('A9:J9')
  summary.getCell('A9').value = `Tổng tiền thu hộ COD: ${totalCod.toLocaleString('vi-VN')} VNĐ`
  summary.getCell('A9').font = { name: 'Aptos Display', size: 14, bold: true, color: { argb: DARK } }
  summary.getCell('A9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BLUE } }
  summary.getCell('A9').alignment = { vertical: 'middle', horizontal: 'center' }
  summary.getRow(9).height = 30

  summary.getCell('A11').value = 'PHÂN BỔ THEO TRẠNG THÁI'
  summary.getCell('A11').font = { name: 'Aptos', size: 11, bold: true, color: { argb: DARK } }
  const statusHeader = summary.getRow(12)
  statusHeader.values = ['Trạng thái', 'Số vận đơn', 'Tỷ trọng']
  styleTableHeader(statusHeader)
  ;(['waiting', 'picked', 'transit', 'success', 'failed'] as const).forEach(status => {
    summary.addRow([
      SHIPMENT_STATUS_LABELS[status],
      statusCounts[status],
      shipments.length ? statusCounts[status] / shipments.length : 0,
    ])
  })
  styleDataRows(summary, 13, 17)
  summary.getColumn(3).numFmt = '0.0%'
  summary.columns = [24, 16, 14, 4, 16, 16, 16, 16, 16, 16].map(width => ({ width }))

  const carrierGroups = new Map<string, {
    total: number
    success: number
    failed: number
    cod: number
    deliveryHours: number[]
  }>()
  shipments.forEach(shipment => {
    const carrier = shipment.carrierName?.trim() || 'Chưa xác định'
    const current = carrierGroups.get(carrier) ?? { total: 0, success: 0, failed: 0, cod: 0, deliveryHours: [] }
    current.total += 1
    current.cod += Number(shipment.codAmount || 0)
    if (shipment.milestoneType === 'success') current.success += 1
    if (shipment.milestoneType === 'failed') current.failed += 1
    if (shipment.shippedAt && shipment.deliveredAt) {
      const hours = (new Date(shipment.deliveredAt).getTime() - new Date(shipment.shippedAt).getTime()) / 3_600_000
      if (Number.isFinite(hours) && hours >= 0) current.deliveryHours.push(hours)
    }
    carrierGroups.set(carrier, current)
  })

  const carriers = workbook.addWorksheet('Theo đơn vị vận chuyển', { properties: { tabColor: { argb: ORANGE } } })
  applyTitle(carriers, 'HIỆU QUẢ THEO ĐƠN VỊ VẬN CHUYỂN', `${carrierGroups.size.toLocaleString('vi-VN')} đơn vị vận chuyển • Số liệu tính từ các vận đơn trong báo cáo`, 'H')
  carriers.addRow([])
  const carrierHeader = carriers.addRow(['STT', 'Đơn vị vận chuyển', 'Tổng vận đơn', 'Thành công', 'Thất bại', 'Tỷ lệ thành công', 'Giao TB (giờ)', 'Tổng COD'])
  styleTableHeader(carrierHeader)
  Array.from(carrierGroups.entries())
    .sort(([, left], [, right]) => right.total - left.total)
    .forEach(([carrier, data], index) => {
      const resolved = data.success + data.failed
      const averageHours = data.deliveryHours.length
        ? data.deliveryHours.reduce((sum, hours) => sum + hours, 0) / data.deliveryHours.length
        : null
      carriers.addRow([
        index + 1,
        carrier,
        data.total,
        data.success,
        data.failed,
        resolved ? data.success / resolved : 0,
        averageHours,
        data.cod,
      ])
    })
  const carrierEnd = Math.max(carrierHeader.number, carriers.rowCount)
  styleDataRows(carriers, carrierHeader.number + 1, carrierEnd)
  carriers.autoFilter = { from: `A${carrierHeader.number}`, to: `H${carrierEnd}` }
  carriers.views = [{ state: 'frozen', ySplit: carrierHeader.number, xSplit: 2, showGridLines: false }]
  carriers.columns = [8, 28, 15, 14, 14, 19, 17, 20].map(width => ({ width }))
  carriers.getColumn(6).numFmt = '0.0%'
  carriers.getColumn(7).numFmt = '0.0'
  carriers.getColumn(8).numFmt = '#,##0 "₫"'

  const detail = workbook.addWorksheet('Chi tiết vận đơn', { properties: { tabColor: { argb: GREEN } } })
  applyTitle(detail, 'CHI TIẾT VẬN ĐƠN', `${shipments.length.toLocaleString('vi-VN')} vận đơn • ${filterLabel} • Nguồn: database`, 'M')
  detail.addRow([])
  const detailHeader = detail.addRow([
    'STT',
    'Mã vận đơn',
    'Mã đơn gốc',
    'Đơn vị vận chuyển',
    'Nơi đến',
    'Tiền COD',
    'Trạng thái',
    'Hành trình mới nhất',
    'Ngày gửi',
    'Ngày giao',
    'Ngày tạo',
    'Cập nhật cuối',
    'ID vận đơn',
  ])
  styleTableHeader(detailHeader)
  shipments.forEach((shipment, index) => {
    detail.addRow([
      index + 1,
      shipment.waybillCode,
      shipment.orderId || '',
      shipment.carrierName || 'Chưa xác định',
      shipment.destination || '',
      Number(shipment.codAmount || 0),
      SHIPMENT_STATUS_LABELS[shipment.milestoneType],
      shipment.latestMilestone || '',
      excelDate(shipment.shippedAt),
      excelDate(shipment.deliveredAt),
      excelDate(shipment.createdAt),
      excelDate(shipment.updatedAt),
      shipment.id,
    ])
  })
  const detailEnd = Math.max(detailHeader.number, detail.rowCount)
  styleDataRows(detail, detailHeader.number + 1, detailEnd)
  detail.autoFilter = { from: `A${detailHeader.number}`, to: `M${detailEnd}` }
  detail.views = [{ state: 'frozen', ySplit: detailHeader.number, xSplit: 3, showGridLines: false }]
  detail.columns = [8, 20, 20, 25, 30, 18, 24, 34, 19, 19, 19, 19, 38].map(width => ({ width }))
  detail.getColumn(6).numFmt = '#,##0 "₫"'
  ;[9, 10, 11, 12].forEach(column => { detail.getColumn(column).numFmt = 'dd/mm/yyyy hh:mm' })
  for (let rowNumber = detailHeader.number + 1; rowNumber <= detailEnd; rowNumber += 1) {
    const statusCell = detail.getCell(rowNumber, 7)
    const status = shipments[rowNumber - detailHeader.number - 1]?.milestoneType
    const color = status === 'success' ? GREEN : status === 'failed' ? RED : status === 'transit' ? ORANGE : BLUE
    statusCell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: color } }
  }

  await downloadWorkbook(workbook, `bao-cao-van-chuyen-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
