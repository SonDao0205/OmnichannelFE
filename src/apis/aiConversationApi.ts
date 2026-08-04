import { AxiosError } from 'axios'
import { csrfHeader, managementApi } from './authApi'

export type AiConversationMode = 'AUTO' | 'SUGGEST_ONLY' | 'HUMAN_ONLY'
export type AiRunStatus =
  | 'GENERATING'
  | 'GENERATED'
  | 'QUALITY_CHECKING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SENT'
  | 'FAILED'
  | 'HANDED_OFF'

export type AiAnalysis = {
  detected_language: string
  intent_code: string
  sentiment?: string | null
  urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  confidence: number
}

export type AiQualityCheck = {
  check_type: string
  passed: boolean
  score?: number | null
  findings: Record<string, unknown>
}

export type AiSource = {
  chunk_id: string
  document_id: string
  title: string
  content: string
  score: number
}

export type AiRun = {
  id: string
  tenant_id: string
  conversation_id: string
  trigger_message_id: string
  status: AiRunStatus
  generated_text?: string | null
  confidence?: number | null
  requires_human_review: boolean
  result?: {
    answer?: string
    analysis?: AiAnalysis
    handoff_reason?: string | null
    recommendation_type?: string
  } | null
  quality_checks: AiQualityCheck[]
  sources: AiSource[]
  latency_ms?: number | null
  input_tokens?: number | null
  output_tokens?: number | null
  error_code?: string | null
  failure_reason?: string | null
}

type AiRunAccepted = {
  run_id: string
  status: 'GENERATING'
  idempotent_replay: boolean
}

export async function createAiSuggestion(
  conversationId: string,
  triggerMessageId: string,
  requestId: string,
) {
  const headers = await csrfHeader()
  const { data } = await managementApi.post<AiRun | AiRunAccepted>(
    `/api/ai/conversations/${conversationId}/suggestions`,
    { triggerMessageId, requestId },
    { headers },
  )
  return data
}

export async function fetchLatestAiRun(conversationId: string) {
  try {
    const { data } = await managementApi.get<AiRun>(
      `/api/ai/conversations/${conversationId}/runs/latest`,
    )
    return data
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export async function fetchAiRun(runId: string) {
  const { data } = await managementApi.get<AiRun>(`/api/ai/runs/${runId}`)
  return data
}

export async function approveAiRun(
  runId: string,
  correctedText: string,
  send: boolean,
) {
  const headers = await csrfHeader()
  const { data } = await managementApi.post<AiRun>(
    `/api/ai/runs/${runId}/approve`,
    { correctedText: correctedText.trim() || null, send },
    { headers },
  )
  return data
}

export async function rejectAiRun(runId: string, reason: string) {
  const headers = await csrfHeader()
  const { data } = await managementApi.post<AiRun>(
    `/api/ai/runs/${runId}/reject`,
    { reason },
    { headers },
  )
  return data
}

export async function sendAiFeedback(
  runId: string,
  rating: number,
  feedbackType: 'GOOD' | 'INCORRECT',
  correctedText?: string,
) {
  const headers = await csrfHeader()
  await managementApi.post(
    '/api/ai/feedback',
    {
      aiResponseRunId: runId,
      rating,
      feedbackType,
      commentText: null,
      correctedText: correctedText?.trim() || null,
    },
    { headers },
  )
}

export async function updateAiConversationMode(
  conversationId: string,
  mode: AiConversationMode,
) {
  const headers = await csrfHeader()
  const { data } = await managementApi.patch<{
    conversationId: string
    aiMode: AiConversationMode
  }>(`/api/ai/conversations/${conversationId}/mode`, { mode }, { headers })
  return data
}

export function isAiRunAccepted(
  value: AiRun | AiRunAccepted,
): value is AiRunAccepted {
  return 'run_id' in value
}
