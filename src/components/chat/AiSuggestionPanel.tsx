import {
  CheckOutlined,
  CloseOutlined,
  RobotOutlined,
  SendOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import type { AiRun } from '../../apis/aiConversationApi'

type AiSuggestionPanelProps = {
  run: AiRun | null
  canSuggest: boolean
  canApprove: boolean
  isBusy: boolean
  isAiEnabled: boolean
  errorMessage: string | null
  onGenerate: () => Promise<void>
  onApprove: (text: string, send: boolean) => Promise<void>
  onReject: (reason: string) => Promise<void>
  onFeedback: (
    rating: number,
    feedbackType: 'GOOD' | 'INCORRECT',
    correctedText: string,
  ) => Promise<void>
  onUseSuggestion: (text: string) => void
}

const statusLabels: Record<AiRun['status'], string> = {
  GENERATING: 'Đang phân tích',
  QUALITY_CHECKING: 'Đang kiểm tra',
  GENERATED: 'Chờ nhân viên duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  SENT: 'Đã gửi',
  FAILED: 'Xử lý thất bại',
  HANDED_OFF: 'Đã chuyển nhân viên',
}

export default function AiSuggestionPanel({
  run,
  canSuggest,
  canApprove,
  isBusy,
  isAiEnabled,
  errorMessage,
  onGenerate,
  onApprove,
  onReject,
  onFeedback,
  onUseSuggestion,
}: AiSuggestionPanelProps) {
  const [answer, setAnswer] = useState(run?.generated_text ?? '')
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)

  useEffect(() => {
    setAnswer(run?.generated_text ?? '')
    setRejectReason('')
    setShowReject(false)
    setFeedbackSent(false)
  }, [run?.generated_text, run?.id])

  const analysis = run?.result?.analysis
  const failedChecks = run?.quality_checks.filter((check) => !check.passed) ?? []
  const isHandoff = run?.status === 'HANDED_OFF'
  const canReview =
    canApprove &&
    Boolean(answer.trim()) &&
    run !== null &&
    ['GENERATED', 'APPROVED', 'REJECTED'].includes(run.status)

  return (
    <section className={`chat-ai-panel ${isHandoff ? 'is-handoff' : ''}`}>
      <header>
        <div className="chat-ai-title">
          <span><RobotOutlined /></span>
          <div>
            <strong>Trợ lý AI</strong>
            <small>
              {run ? statusLabels[run.status] : 'Chưa tạo gợi ý cho tin nhắn mới nhất'}
            </small>
          </div>
        </div>
        <button
          className="chat-ai-generate"
          disabled={!canSuggest || !isAiEnabled || isBusy}
          onClick={() => void onGenerate()}
          type="button"
        >
          {isBusy ? 'Đang xử lý...' : 'Tạo gợi ý'}
        </button>
      </header>

      {!canSuggest ? (
        <p className="chat-ai-notice">Tài khoản chưa có quyền AI.SUGGEST.</p>
      ) : null}
      {canSuggest && !isAiEnabled ? (
        <p className="chat-ai-notice">
          AI đang tắt hoặc đã chuyển nhân viên. Chọn “AI gợi ý” để bật lại.
        </p>
      ) : null}
      {errorMessage ? <p className="chat-ai-error">{errorMessage}</p> : null}

      {isHandoff ? (
        <div className="chat-ai-handoff">
          <WarningOutlined />
          <div>
            <strong>AI đã dừng xử lý hội thoại này</strong>
            <span>
              {run?.result?.handoff_reason ??
                run?.failure_reason ??
                'Tình huống cần nhân viên trực tiếp xử lý.'}
            </span>
          </div>
        </div>
      ) : null}

      {run && answer ? (
        <div className="chat-ai-body">
          <textarea
            aria-label="Nội dung gợi ý AI"
            disabled={isBusy || run.status === 'SENT'}
            onChange={(event) => setAnswer(event.target.value)}
            rows={3}
            value={answer}
          />

          <div className="chat-ai-meta">
            {analysis ? (
              <>
                <span>Ý định: {analysis.intent_code}</span>
                <span>Cảm xúc: {analysis.sentiment ?? 'Trung tính'}</span>
                <span>Khẩn cấp: {analysis.urgency}</span>
                <span>Ngôn ngữ: {analysis.detected_language}</span>
              </>
            ) : null}
            {run.confidence !== null && run.confidence !== undefined ? (
              <span>Độ tin cậy: {Math.round(run.confidence * 100)}%</span>
            ) : null}
            {failedChecks.length > 0 ? (
              <span className="is-warning">{failedChecks.length} kiểm tra chưa đạt</span>
            ) : null}
            {run.sources.length > 0 ? (
              <span>{run.sources.length} nguồn RAG</span>
            ) : null}
          </div>

          <div className="chat-ai-actions">
            <button
              disabled={isBusy || !answer.trim()}
              onClick={() => onUseSuggestion(answer.trim())}
              type="button"
            >
              Dùng làm bản nháp
            </button>
            {canReview ? (
              <>
                <button
                  disabled={isBusy}
                  onClick={() => void onApprove(answer, false)}
                  type="button"
                >
                  <CheckOutlined /> Duyệt
                </button>
                <button
                  className="is-primary"
                  disabled={isBusy}
                  onClick={() => void onApprove(answer, true)}
                  type="button"
                >
                  <SendOutlined /> Duyệt &amp; gửi
                </button>
              </>
            ) : null}
            {canApprove && run.status === 'GENERATED' ? (
              <button
                className="is-danger"
                disabled={isBusy}
                onClick={() => setShowReject((current) => !current)}
                type="button"
              >
                <CloseOutlined /> Từ chối
              </button>
            ) : null}
          </div>

          {showReject ? (
            <div className="chat-ai-reject">
              <input
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Nhập lý do từ chối (ít nhất 3 ký tự)"
                value={rejectReason}
              />
              <button
                disabled={isBusy || rejectReason.trim().length < 3}
                onClick={() => void onReject(rejectReason.trim())}
                type="button"
              >
                Xác nhận
              </button>
            </div>
          ) : null}

          {!feedbackSent && ['GENERATED', 'APPROVED', 'SENT'].includes(run.status) ? (
            <div className="chat-ai-feedback">
              <span>Gợi ý này hữu ích?</span>
              <button
                disabled={isBusy}
                onClick={() => {
                  void onFeedback(5, 'GOOD', answer)
                    .then(() => setFeedbackSent(true))
                    .catch(() => undefined)
                }}
                type="button"
              >
                Có
              </button>
              <button
                disabled={isBusy}
                onClick={() => {
                  void onFeedback(2, 'INCORRECT', answer)
                    .then(() => setFeedbackSent(true))
                    .catch(() => undefined)
                }}
                type="button"
              >
                Chưa đúng
              </button>
            </div>
          ) : null}
          {feedbackSent ? <p className="chat-ai-feedback-sent">Đã lưu phản hồi.</p> : null}
        </div>
      ) : null}
    </section>
  )
}
