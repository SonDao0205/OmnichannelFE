import {
  CheckCircleFilled,
  ClockCircleOutlined,
  DisconnectOutlined,
  LinkOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import { toast } from 'react-toastify'
import {
  marketplaceApi,
  marketplaceErrorMessage,
} from '../../apis/marketplaceApi'
import { useAuth } from '../../contexts/authContext'
import type {
  MarketplaceCode,
  MarketplaceConnection,
} from '../../types/marketplace'
import './connect.css'

type MarketplaceDefinition = {
  code: MarketplaceCode
  name: string
  shortName: string
  description: string
  logo: string
  color: string
}

const MARKETPLACES: MarketplaceDefinition[] = [
  {
    code: 'TIKTOK_SHOP',
    name: 'TikTok Shop',
    shortName: 'TikTok',
    description:
      'Đồng bộ sản phẩm, đơn hàng và hội thoại từ cửa hàng TikTok Shop giả lập.',
    logo: 'T',
    color: '#171923',
  },
  {
    code: 'LAZADA',
    name: 'Lazada',
    shortName: 'Lazada',
    description:
      'Kết nối seller Lazada giả lập để quản lý dữ liệu bán hàng trong một nơi.',
    logo: 'L',
    color: '#151a67',
  },
]

const callbackErrors: Record<string, string> = {
  MARKETPLACE_UNAVAILABLE:
    'Không thể kết nối đến sàn giả lập. Hãy kiểm tra server sàn đang chạy.',
  INVALID_OAUTH_STATE: 'Phiên liên kết không hợp lệ. Vui lòng thử lại.',
  OAUTH_STATE_EXPIRED: 'Phiên liên kết đã hết hạn. Vui lòng thử lại.',
  OAUTH_ACCESS_DENIED: 'Bạn đã từ chối cấp quyền cho hệ thống.',
  SHOP_ALREADY_CONNECTED_TO_ANOTHER_TENANT:
    'Shop này đã được liên kết với một doanh nghiệp khác.',
}

function formatDate(value: string | null): string {
  if (!value) return 'Chưa có'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function ConnectScreen() {
  const { hasPermission } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [connections, setConnections] = useState<MarketplaceConnection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [workingKey, setWorkingKey] = useState<string | null>(null)

  const canConnect = hasPermission('ACCOUNT.CONNECT')
  const canDisconnect = hasPermission('ACCOUNT.DISCONNECT')

  useEffect(() => {
    let active = true
    marketplaceApi
      .list()
      .then((items) => {
        if (active) setConnections(items)
      })
      .catch((error) => {
        if (active) toast.error(marketplaceErrorMessage(error))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const result = searchParams.get('connection')
    if (!result) return
    const marketplace = searchParams.get('marketplace')
    const marketplaceName =
      MARKETPLACES.find((item) => item.code === marketplace)?.name ?? 'sàn'
    if (result === 'success') {
      toast.success(`Đã liên kết ${marketplaceName} thành công.`)
    } else {
      const errorCode = searchParams.get('error') ?? ''
      toast.error(
        callbackErrors[errorCode] ??
          `Không thể hoàn tất liên kết ${marketplaceName}.`,
      )
    }
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const connectionsByMarketplace = useMemo(() => {
    const grouped = new Map<MarketplaceCode, MarketplaceConnection[]>()
    for (const connection of connections) {
      const current = grouped.get(connection.marketplace) ?? []
      current.push(connection)
      grouped.set(connection.marketplace, current)
    }
    return grouped
  }, [connections])

  const authorize = async (marketplace: MarketplaceCode) => {
    setWorkingKey(`authorize:${marketplace}`)
    try {
      const authorization = await marketplaceApi.authorize(
        marketplace,
        `${window.location.origin}/connect`,
      )
      window.location.assign(authorization.authorizationUrl)
    } catch (error) {
      toast.error(marketplaceErrorMessage(error))
      setWorkingKey(null)
    }
  }

  const verify = async (connection: MarketplaceConnection) => {
    setWorkingKey(`verify:${connection.id}`)
    try {
      const updated = await marketplaceApi.verify(connection.id)
      setConnections((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      toast.success(`Kết nối ${connection.shopName} đang hoạt động tốt.`)
    } catch (error) {
      toast.error(marketplaceErrorMessage(error))
    } finally {
      setWorkingKey(null)
    }
  }

  const refresh = async (connection: MarketplaceConnection) => {
    setWorkingKey(`refresh:${connection.id}`)
    try {
      const updated = await marketplaceApi.refresh(connection.id)
      setConnections((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      toast.success('Đã làm mới access token của sàn.')
    } catch (error) {
      toast.error(marketplaceErrorMessage(error))
    } finally {
      setWorkingKey(null)
    }
  }

  const disconnect = async (connection: MarketplaceConnection) => {
    const confirmation = await Swal.fire({
      title: 'Ngắt liên kết cửa hàng?',
      text: `${connection.shopName} sẽ ngừng đồng bộ dữ liệu với hệ thống.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ngắt liên kết',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#e5484d',
      reverseButtons: true,
    })
    if (!confirmation.isConfirmed) return

    setWorkingKey(`disconnect:${connection.id}`)
    try {
      await marketplaceApi.disconnect(connection.id)
      setConnections((current) =>
        current.filter((item) => item.id !== connection.id),
      )
      toast.success('Đã ngắt liên kết cửa hàng.')
    } catch (error) {
      toast.error(marketplaceErrorMessage(error))
    } finally {
      setWorkingKey(null)
    }
  }

  return (
    <section className="connect-page">
      <header className="connect-header">
        <div>
          <span className="connect-eyebrow">Kênh bán hàng</span>
          <h1>Liên kết sàn</h1>
          <p>
            Kết nối shop giả lập để Omnichannel có quyền đọc và cập nhật dữ
            liệu theo phạm vi được cấp.
          </p>
        </div>
        <div className="connect-security-note">
          <SafetyCertificateOutlined />
          <span>
            Token sàn được mã hóa và chỉ lưu tại backend
            <small>Frontend không nhận access token của TikTok hay Lazada</small>
          </span>
        </div>
      </header>

      <div className="connect-summary">
        <div>
          <span className="connect-summary-icon is-blue">
            <LinkOutlined />
          </span>
          <span>
            <strong>{connections.length}</strong>
            <small>Shop đã liên kết</small>
          </span>
        </div>
        <div>
          <span className="connect-summary-icon is-green">
            <CheckCircleFilled />
          </span>
          <span>
            <strong>
              {
                connections.filter(
                  (connection) => connection.status === 'CONNECTED',
                ).length
              }
            </strong>
            <small>Kết nối hoạt động</small>
          </span>
        </div>
      </div>

      <div className="connect-grid" aria-busy={isLoading}>
        {MARKETPLACES.map((marketplace) => {
          const marketplaceConnections =
            connectionsByMarketplace.get(marketplace.code) ?? []
          const isAuthorizing =
            workingKey === `authorize:${marketplace.code}`

          return (
            <article className="marketplace-card" key={marketplace.code}>
              <div className="marketplace-card-header">
                <span
                  className={`marketplace-logo is-${marketplace.code.toLowerCase()}`}
                  style={{ backgroundColor: marketplace.color }}
                >
                  {marketplace.logo}
                </span>
                <span className="marketplace-heading">
                  <strong>{marketplace.name}</strong>
                  <small>
                    {marketplaceConnections.length
                      ? `${marketplaceConnections.length} shop đã kết nối`
                      : 'Chưa kết nối'}
                  </small>
                </span>
                <span
                  className={`marketplace-status ${
                    marketplaceConnections.length ? 'is-connected' : ''
                  }`}
                >
                  {marketplaceConnections.length ? (
                    <>
                      <CheckCircleFilled /> Hoạt động
                    </>
                  ) : (
                    'Chưa liên kết'
                  )}
                </span>
              </div>

              <p className="marketplace-description">
                {marketplace.description}
              </p>

              {isLoading ? (
                <div className="connection-skeleton">
                  <span />
                  <span />
                  <span />
                </div>
              ) : (
                <div className="shop-list">
                  {marketplaceConnections.map((connection) => (
                    <div className="shop-connection" key={connection.id}>
                      <div className="shop-connection-title">
                        <span>
                          <strong>{connection.shopName}</strong>
                          <small>{connection.externalAccountId}</small>
                        </span>
                        <span className="shop-site">{connection.siteId}</span>
                      </div>
                      <dl>
                        <div>
                          <dt>Access token hết hạn</dt>
                          <dd>{formatDate(connection.tokenExpiresAt)}</dd>
                        </div>
                        <div>
                          <dt>Xác minh gần nhất</dt>
                          <dd>{formatDate(connection.lastVerifiedAt)}</dd>
                        </div>
                        <div>
                          <dt>Phạm vi</dt>
                          <dd>{connection.scopes.length} quyền</dd>
                        </div>
                      </dl>
                      <div className="shop-actions">
                        <button
                          type="button"
                          onClick={() => void verify(connection)}
                          disabled={
                            !canConnect ||
                            workingKey === `verify:${connection.id}`
                          }
                        >
                          <SyncOutlined
                            spin={workingKey === `verify:${connection.id}`}
                          />
                          Xác minh
                        </button>
                        <button
                          type="button"
                          onClick={() => void refresh(connection)}
                          disabled={
                            !canConnect ||
                            workingKey === `refresh:${connection.id}`
                          }
                        >
                          <ReloadOutlined
                            spin={workingKey === `refresh:${connection.id}`}
                          />
                          Làm mới token
                        </button>
                        <button
                          type="button"
                          className="is-danger"
                          onClick={() => void disconnect(connection)}
                          disabled={
                            !canDisconnect ||
                            workingKey === `disconnect:${connection.id}`
                          }
                        >
                          <DisconnectOutlined />
                          Ngắt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="connect-marketplace-button"
                onClick={() => void authorize(marketplace.code)}
                disabled={!canConnect || isAuthorizing}
                title={
                  canConnect
                    ? undefined
                    : 'Tài khoản thiếu quyền ACCOUNT.CONNECT'
                }
              >
                {isAuthorizing ? (
                  <ReloadOutlined spin />
                ) : (
                  <LinkOutlined />
                )}
                {marketplaceConnections.length
                  ? `Liên kết thêm ${marketplace.shortName}`
                  : `Liên kết ${marketplace.name}`}
              </button>
            </article>
          )
        })}
      </div>

      <footer className="connect-help">
        <ClockCircleOutlined />
        <span>
          Phiên xác thực chỉ có hiệu lực trong 10 phút và chỉ được sử dụng một
          lần.
        </span>
      </footer>
    </section>
  )
}
