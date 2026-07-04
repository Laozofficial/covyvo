import { api } from './api'

export type AdaMessage = {
  role: 'user' | 'model'
  text: string
}

export type AdaChatResponse = {
  answer: string
  usedTools?: Array<{ name: string; args: Record<string, unknown> }>
  keyLooksValid?: boolean
}

export const aiApi = {
  chat: (message: string, history: AdaMessage[] = []) =>
    api<AdaChatResponse>('/ai/chat', {
      method: 'POST',
      body: { message, history: history.slice(-12) },
      auth: true,
    }),
}
