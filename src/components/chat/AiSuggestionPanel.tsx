import {
  CloseOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  RobotOutlined,
  SendOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useState } from 'react'
import type { AiRun } from '../../apis/aiConversationApi'

type AiPanelMode = 'ai-autopilot' | 'human' | 'ai-recommend'

type AiSuggestionPanelProps = {
  run: AiRun | null
  mode: AiPanelMode
  aiIssueReason: string | null
  canSuggest: boolean
  canApprove: boolean
  isBusy: boolean
  isAutopilotActive: boolean
  errorMessage: string | null
  onGenerate: () => Promise<void>
  onPauseAutopilot: () => Promise<void>
  onStartAutopilot: () => Promise<void>
  onApprove: (text: string, send: boolean) => Promise<void>
  onReject: (reason: string) => Promise<void>
  onFeedback: (
    rating: number,
    feedbackType: 'GOOD' | 'INCORRECT',
    correctedText?: string,
    commentText?: string,
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
  mode,
  aiIssueReason,
  canSuggest,
  canApprove,
  isBusy,
  isAutopilotActive,
  errorMessage,
  onGenerate,
  onPauseAutopilot,
  onStartAutopilot,
  onApprove,
  onReject,
  onFeedback,
  onUseSuggestion,
}: AiSuggestionPanelProps) {
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [showFeedbackReason, setShowFeedbackReason] = useState(false)
  const [feedbackReason, setFeedbackReason] = useState('')

  const answer = run?.generated_text?.trim() ?? ''
  const analysis = run?.result?.analysis
  const failedChecks = run?.quality_checks.filter((check) => !check.passed) ?? []
  const isAutopilot = mode === 'ai-autopilot'
  const isAutopilotRun =
    isAutopilot ||
    run?.prompt_version === 'stateless-autopilot-v1' ||
    Boolean(aiIssueReason)
  const isRecommend = mode === 'ai-recommend'
  const isRunError = run?.status === 'FAILED' || run?.status === 'HANDED_OFF'
  const displayedError =
    errorMessage ??
    aiIssueReason ??
    (isRunError
      ? run?.failure_reason ?? run?.result?.handoff_reason ?? 'AI cần nhân viên xử lý.'
      : null)
  const isError = Boolean(displayedError)
  const canReview =
    isRecommend &&
    canApprove &&
    Boolean(answer) &&
    run !== null &&
    ['GENERATED', 'APPROVED'].includes(run.status)
  const canSendFeedback =
    Boolean(answer) &&
    run !== null &&
    ['GENERATED', 'APPROVED', 'SENT', 'HANDED_OFF'].includes(run.status)

  const panelTitle = isAutopilot || aiIssueReason
    ? 'AI Autopilot'
    : isRecommend
      ? 'Trợ lý AI đề xuất'
      : 'Trợ lý AI'
  const panelStatus = isError
    ? 'AI gặp lỗi và hội thoại đã chuyển cho nhân viên'
    : isAutopilot
      ? isAutopilotActive
        ? 'AI đang đảm nhận hội thoại này'
        : 'AI Autopilot chưa được bắt đầu'
      : isRecommend
        ? run
          ? statusLabels[run.status]
          : 'Chưa tạo gợi ý cho tin nhắn mới nhất'
        : 'Nhân viên đang đảm nhận hội thoại này'

  return (
    <section className={`chat-ai-panel ${isError ? 'is-error' : ''}`}>
      <header>
        <div className="chat-ai-title">
          <span><RobotOutlined /></span>
          <div>
            <strong>{panelTitle}</strong>
            <small>{panelStatus}</small>
          </div>
        </div>

        {isAutopilot && isAutopilotActive ? (
          <button
            className="chat-ai-pause"
            disabled={!canSuggest || isBusy}
            onClick={() => void onPauseAutopilot()}
            type="button"
          >
            <PauseCircleOutlined /> {isBusy ? 'Đang dừng...' : 'Tạm dừng AI'}
          </button>
        ) : null}

        {isAutopilot && !isAutopilotActive ? (
          <button
            className="chat-ai-start"
            disabled={!canSuggest || isBusy}
            onClick={() => void onStartAutopilot()}
            type="button"
          >
            <PlayCircleOutlined /> {isBusy ? 'Đang bắt đầu...' : 'Bắt đầu AI'}
          </button>
        ) : null}

        {isRecommend ? (
          <button
            className="chat-ai-generate"
            disabled={!canSuggest || isBusy}
            onClick={() => void onGenerate()}
            type="button"
          >
            {isBusy ? 'Đang xử lý...' : 'Tạo gợi ý'}
          </button>
        ) : null}
      </header>

      {!canSuggest ? (
        <p className="chat-ai-notice">Tài khoản chưa có quyền AI.SUGGEST.</p>
      ) : null}

      {mode === 'human' && !isError ? (
        <p className="chat-ai-notice">
          AI đang tạm dừng. Chọn AI Autopilot hoặc AI recommend để bật lại.
        </p>
      ) : null}

      {isAutopilot && !isAutopilotActive && !isError ? (
        <div className="chat-ai-autopilot-state">
          AI chưa xử lý tin nhắn. Bấm “Bắt đầu AI” để kích hoạt Autopilot cho
          riêng hội thoại này.
        </div>
      ) : null}

      {isAutopilot && isAutopilotActive && !isError ? (
        <div className="chat-ai-autopilot-state">
          AI sẽ tự động phân tích và trả lời tin nhắn mới. Nhân viên có thể tạm dừng
          bất kỳ lúc nào để chuyển hội thoại về Human.
        </div>
      ) : null}

      {displayedError ? (
        <div className="chat-ai-handoff">
          <WarningOutlined />
          <div>
            <strong>AI đã dừng xử lý hội thoại này</strong>
            <span>{displayedError}</span>
          </div>
        </div>
      ) : null}

      {run && answer ? (
        <div className="chat-ai-body">
          <div
            aria-label="Nội dung phản hồi của AI"
            aria-readonly="true"
            className="chat-ai-response"
            role="textbox"
          >
            {answer}
          </div>

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
            {run.sources.length > 0 ? <span>{run.sources.length} nguồn RAG</span> : null}
          </div>

          {isRecommend ? (
            <div className="chat-ai-actions">
              <button
                disabled={isBusy || !answer}
                onClick={() => onUseSuggestion(answer)}
                type="button"
              >
                Dùng làm bản nháp
              </button>
              {canReview ? (
                <button
                  className="is-primary"
                  disabled={isBusy}
                  onClick={() => void onApprove(answer, true)}
                  type="button"
                >
                  <SendOutlined /> Duyệt &amp; gửi
                </button>
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
          ) : null}

          {isRecommend && showReject ? (
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

          {!feedbackSent && canSendFeedback ? (
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
                  if (isAutopilotRun) {
                    setShowFeedbackReason(true)
                    return
                  }
                  void onFeedback(2, 'INCORRECT', answer)
                    .then(() => setFeedbackSent(true))
                    .catch(() => undefined)
                }}
                type="button"
              >
                {isAutopilotRun ? 'Không' : 'Chưa đúng'}
              </button>
            </div>
          ) : null}

          {!feedbackSent && showFeedbackReason ? (
            <div className="chat-ai-feedback-reason">
              <input
                onChange={(event) => setFeedbackReason(event.target.value)}
                placeholder="Cho biết lý do gợi ý chưa hữu ích"
                value={feedbackReason}
              />
              <button
                disabled={isBusy || feedbackReason.trim().length < 3}
                onClick={() => {
                  void onFeedback(2, 'INCORRECT', answer, feedbackReason.trim())
                    .then(() => setFeedbackSent(true))
                    .catch(() => undefined)
                }}
                type="button"
              >
                Gửi phản hồi
              </button>
            </div>
          ) : null}

          {feedbackSent ? (
            <p className="chat-ai-feedback-sent">Đã lưu phản hồi.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
