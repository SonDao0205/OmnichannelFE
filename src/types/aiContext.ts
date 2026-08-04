export type AiContextMood =
  | 'PROFESSIONAL'
  | 'FRIENDLY'
  | 'WARM'
  | 'YOUTHFUL'
  | 'CONCISE'
  | 'EMPATHETIC'
  | 'CUSTOM'

export type AiShopContext = {
  id: string
  marketplaceAccountId: string
  shopName: string
  contextName: string
  mood: AiContextMood
  assistantName: string
  businessDescription: string
  brandVoice: string
  responseGuidelines: string
  prohibitedTopics: string[]
  defaultLanguage: string
  maxResponseCharacters: number
  defaultKnowledgeBaseId: string | null
  active: boolean
  activatedAt: string | null
  createdAt: string
  updatedAt: string
}

export type AiShopContextPayload = {
  marketplaceAccountId: string
  contextName: string
  mood: AiContextMood
  assistantName: string
  businessDescription: string
  brandVoice: string
  responseGuidelines: string
  prohibitedTopics: string[]
  defaultLanguage: string
  maxResponseCharacters: number
  defaultKnowledgeBaseId: string | null
}

export type AiShopKnowledgeStatus = {
  marketplaceAccountId: string
  status: 'BUILDING' | 'READY' | 'DEGRADED' | 'FAILED'
  catalogVersion: string | null
  productCount: number
  variantCount: number
  missingColorCount: number
  missingSizeCount: number
  indexedPoints: number
  cacheStatus: string
  vectorStatus: string
  lastBuiltAt: string | null
  lastIndexedAt: string | null
  lastError: string | null
}
