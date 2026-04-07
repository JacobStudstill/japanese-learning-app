import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import Anthropic from '@anthropic-ai/sdk'
import path from 'path'
import fs from 'fs'

// Simple dev detection without @electron-toolkit/utils
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
import {
  getProfile,
  updateProfile,
  getDueCards,
  getNewCards,
  getDueCardCount,
  getAllCards,
  updateCard,
  recordQuiz,
  getTodayStats,
  getLessonProgress,
  markLessonComplete,
  getAllVocab,
  seedVocabIfEmpty
} from './db'

// Load .env file
function loadEnv() {
  const envPath = path.join(__dirname, '../../.env')
  const altPath = path.join(process.cwd(), '.env')

  for (const p of [envPath, altPath]) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=')
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim()
            const value = trimmed.slice(eqIdx + 1).trim()
            if (!process.env[key]) {
              process.env[key] = value
            }
          }
        }
      }
      break
    }
  }
}

loadEnv()

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0f0f1a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(async () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.japanese-learning-app')
  }

  // Allow speech synthesis and microphone without user gesture prompts
  app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
  app.commandLine.appendSwitch('enable-features', 'SpeechSynthesisEventCharIndex')

  // Grant microphone permission automatically for speech recognition
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'media' || permission === 'microphone') {
      callback(true)
    } else {
      callback(false)
    }
  })

  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    if (permission === 'media' || permission === 'microphone') return true
    return false
  })

  app.on('browser-window-created', (_, window) => {
    // Set up window shortcuts (Dev tools on F12)
    window.webContents.on('before-input-event', (_, input) => {
      if (input.type === 'keyDown' && input.key === 'F12') {
        window.webContents.openDevTools({ mode: 'detach' })
      }
    })
  })

  // Register IPC handlers
  registerIpcHandlers()

  createWindow()

  // Seed vocab
  try {
    const { n5Vocab } = await import('../renderer/src/data/n5-vocab')
    await seedVocabIfEmpty(n5Vocab)
  } catch (err) {
    console.error('Failed to seed vocab:', err)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── Bilingual SSML builder ────────────────────────────────────────────────────

function buildJapaneseSSML(rawText: string, rate: string): string {
  // Strip furigana notation: {漢字|かんじ} → 漢字
  let text = rawText.replace(/\{([^|{}]+)\|[^|{}]+\}/g, '$1')

  // Strip markdown
  text = text.replace(/\*\*?([^*]+)\*\*?/g, '$1')
  text = text.replace(/__?([^_]+)__?/g, '$1')
  text = text.replace(/`[^`]*`/g, '')
  text = text.replace(/#{1,6}\s?/g, '')

  // Keep only Japanese characters — discard all English/Latin text
  const isJpChar = (c: string) => /[\u3000-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef0-9]/.test(c)
  const jpOnly = [...text].filter(isJpChar).join('')

  const esc = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP"><voice name="ja-JP-KeitaNeural"><prosody rate="${rate}">${esc(jpOnly)}</prosody></voice></speak>`
}

// ── IPC Handlers ─────────────────────────────────────────────────────────────

function registerIpcHandlers() {
  // Profile
  ipcMain.handle('get-profile', () => getProfile())
  ipcMain.handle('update-profile', (_, data) => updateProfile(data))

  // Vocab
  ipcMain.handle('get-vocab', () => getAllVocab())
  ipcMain.handle('get-all-cards', () => getAllCards())

  // Cards
  ipcMain.handle('get-due-cards', () => getDueCards())
  ipcMain.handle('get-new-cards', (_, limit) => getNewCards(limit))
  ipcMain.handle('get-due-count', () => getDueCardCount())

  ipcMain.handle('review-card', async (_, { id, rating, interval, easeFactor, repetitions, dueDate, status }) => {
    await updateCard(id, {
      interval,
      ease_factor: easeFactor,
      repetitions,
      due_date: dueDate,
      last_reviewed: new Date().toISOString(),
      status
    })
    await recordQuiz(id, rating)

    // Award XP
    const xpGain = rating === 4 ? 15 : rating === 3 ? 10 : rating === 2 ? 5 : 2
    const profile = await getProfile()
    if (profile) {
      const today = new Date().toISOString().slice(0, 10)
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      let newStreak = (profile.streak as number) || 0
      if (profile.last_study_date !== today) {
        newStreak = profile.last_study_date === yesterday ? newStreak + 1 : 1
      }
      const newXp = ((profile.xp as number) || 0) + xpGain
      const newLevel = Math.floor(newXp / 1000) + 1
      await updateProfile({ xp: newXp, level: newLevel, last_study_date: today, streak: newStreak })
    }
    return { ok: true }
  })

  // Stats
  ipcMain.handle('get-today-stats', () => getTodayStats())

  // Lessons
  ipcMain.handle('get-lesson-progress', () => getLessonProgress())
  ipcMain.handle('mark-lesson-complete', async (_, { unitId, lessonId }) => {
    await markLessonComplete(unitId, lessonId)
    const profile = await getProfile()
    if (profile) {
      const newXp = ((profile.xp as number) || 0) + 50
      const newLevel = Math.floor(newXp / 1000) + 1
      await updateProfile({ xp: newXp, level: newLevel })
    }
    return { ok: true }
  })

  // TTS — fetch MP3 from Azure REST API, return base64 to renderer to play
  ipcMain.handle('speak-text', async (_, { text, slowMode = true }: { text: string; slowMode?: boolean }) => {
    const azureKey = process.env.AZURE_SPEECH_KEY
    const azureRegion = process.env.AZURE_SPEECH_REGION
    if (!azureKey || !azureRegion) return { error: 'Azure credentials missing' }
    console.log('TTS → region:', azureRegion, 'key length:', azureKey.length)

    const rate = slowMode ? '-10%' : '0%'
    const ssml = buildJapaneseSSML(text, rate)
    console.log('TTS → SSML:', ssml)

    try {
      const res = await fetch(
        `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': azureKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
          },
          body: ssml
        }
      )
      if (!res.ok) return { error: `Azure TTS ${res.status}: ${await res.text()}` }
      const buf = await res.arrayBuffer()
      return { audio: Buffer.from(buf).toString('base64') }
    } catch (err: unknown) {
      const e = err as Error & { cause?: Error }
      console.error('TTS fetch error:', e.message, e.cause)
      return { error: e.cause?.message || e.message }
    }
  })

  ipcMain.handle('stop-speech', () => {
    // Renderer handles stopping via Audio element
  })

  // STT — send recorded audio to Azure, get transcript back
  ipcMain.handle('transcribe-audio', async (_, { audioBase64, mimeType }: { audioBase64: string; mimeType: string }) => {
    const azureKey = process.env.AZURE_SPEECH_KEY
    const azureRegion = process.env.AZURE_SPEECH_REGION
    if (!azureKey || !azureRegion) return { error: 'Azure credentials missing' }

    try {
      const audioBuffer = Buffer.from(audioBase64, 'base64')
      const res = await fetch(
        `https://${azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=ja-JP&format=simple`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': azureKey,
            'Content-Type': 'audio/wav',
            'Accept': 'application/json'
          },
          body: audioBuffer
        }
      )
      if (!res.ok) return { error: `Azure STT ${res.status}: ${await res.text()}` }
      const json = await res.json() as { RecognitionStatus: string; DisplayText?: string }
      if (json.RecognitionStatus === 'Success') return { text: json.DisplayText || '' }
      return { error: `No speech recognized (${json.RecognitionStatus})` }
    } catch (e: unknown) {
      const err = e as Error & { cause?: Error }
      console.error('STT fetch error:', err.message, err.cause)
      return { error: err.cause?.message || err.message }
    }
  })

  // Claude AI conversation
  ipcMain.handle('send-message', async (_, { messages }) => {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        return { error: 'ANTHROPIC_API_KEY not set. Please add it to your .env file.' }
      }

      const client = new Anthropic({ apiKey })

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: `You are Keita, a Japanese friend helping the user practice natural conversation. They are a beginner (JLPT N5 level).

Default mode — normal conversation:
- Keep responses to 1-2 short sentences. No lists, no tables, no bullet points, no markdown.
- Write in Japanese first, then put the English translation in parentheses on the same line. Example: {今日|きょう}は{何|なに}を{練習|れんしゅう}しますか？(What would you like to practice today?)
- Use only N5-level words. Short sentences. Natural rhythm.
- For every kanji you write, wrap it with its reading: {kanji|reading}. Example: {私|わたし}、{学校|がっこう}、{食べる|たべる}. Do this for ALL kanji, no exceptions.
- Ask one follow-up question to keep the conversation going.

Teaching mode — switch to this when the user asks how to say something, asks you to teach them, says they don't know a word/phrase, or makes a grammar mistake:
- Talk like a bilingual friend — mix English and Japanese naturally in the same response. No parentheses format here.
- For example: "Sure! To say it's hot you'd say {暑|あつ}い。 If it's raining, {雨|あめ}が{降|ふ}っています。 Give one of those a try!"
- Use English to explain, drop in Japanese phrases naturally as you talk, keep it short and casual.
- End with something that invites them to try, like "Give it a shot!" or "Your turn!"
- Never lecture. Never over-explain. Teach the minimum they need to continue the conversation.

Always:
- Be warm and encouraging. Never make the user feel bad for not knowing something.
- The goal is to get them speaking Japanese as much as possible, but English is a tool you use to help them get there.`,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))
      })

      const textContent = response.content.find(c => c.type === 'text')
      return { content: textContent ? (textContent as { type: 'text'; text: string }).text : '' }
    } catch (err: unknown) {
      const error = err as Error
      return { error: error.message || 'Failed to connect to Claude API' }
    }
  })
}
