import { api } from './api'

export type AdaMessage = {
  role: 'user' | 'model'
  text: string
}

export type AdaChatResponse = {
  reply: string
  toolCalls?: number
}

export const aiApi = {
  chat: (message: string, history: AdaMessage[] = []) =>
    api<AdaChatResponse>('/ai/chat', {
      method: 'POST',
      body: { message, history: history.slice(-12) },
      auth: true,
    }),
}
