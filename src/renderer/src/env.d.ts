/// <reference types="vite/client" />

interface Window {
  api: {
    getProfile: () => Promise<unknown>
    updateProfile: (data: Record<string, unknown>) => Promise<unknown>
    getVocab: () => Promise<unknown>
    getDueCards: () => Promise<unknown>
    getNewCards: (limit?: number) => Promise<unknown>
    getDueCount: () => Promise<number>
    reviewCard: (data: {
      id: number
      rating: number
      interval: number
      easeFactor: number
      repetitions: number
      dueDate: string
      status: string
    }) => Promise<unknown>
    getTodayStats: () => Promise<unknown>
    getLessonProgress: () => Promise<unknown>
    markLessonComplete: (unitId: number, lessonId: number) => Promise<unknown>
    sendMessage: (messages: Array<{ role: string; content: string }>) => Promise<unknown>
  }
  electron: unknown
}
