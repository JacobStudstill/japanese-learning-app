import { contextBridge, ipcRenderer } from 'electron'

// Expose our app API
contextBridge.exposeInMainWorld('api', {
  // Profile
  getProfile: () => ipcRenderer.invoke('get-profile'),
  updateProfile: (data: Record<string, unknown>) => ipcRenderer.invoke('update-profile', data),

  // Vocab
  getVocab: () => ipcRenderer.invoke('get-vocab'),
  getAllCards: () => ipcRenderer.invoke('get-all-cards'),

  // Cards
  getDueCards: () => ipcRenderer.invoke('get-due-cards'),
  getNewCards: (limit?: number) => ipcRenderer.invoke('get-new-cards', limit),
  getDueCount: () => ipcRenderer.invoke('get-due-count'),
  reviewCard: (data: {
    id: number
    rating: number
    interval: number
    easeFactor: number
    repetitions: number
    dueDate: string
    status: string
  }) => ipcRenderer.invoke('review-card', data),

  // Stats
  getTodayStats: () => ipcRenderer.invoke('get-today-stats'),

  // Lessons
  getLessonProgress: () => ipcRenderer.invoke('get-lesson-progress'),
  markLessonComplete: (unitId: number, lessonId: number) =>
    ipcRenderer.invoke('mark-lesson-complete', { unitId, lessonId }),

  // TTS
  speak: (text: string, slowMode?: boolean) => ipcRenderer.invoke('speak-text', { text, slowMode }),
  stopSpeech: () => ipcRenderer.invoke('stop-speech'),

  // STT
  transcribeAudio: (data: { audioBase64: string; mimeType: string }) =>
    ipcRenderer.invoke('transcribe-audio', data),

  // Claude AI
  sendMessage: (messages: Array<{ role: string; content: string }>) =>
    ipcRenderer.invoke('send-message', { messages })
})
