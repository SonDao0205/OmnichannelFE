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
