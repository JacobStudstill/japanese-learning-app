import React, { useState, useEffect, useRef } from 'react'
import { speakJapanese, pauseSpeech, resumeSpeech, stopSpeech, initSpeech, startListening, hasSpeechRecognition } from '../lib/speech'
import { sendMessage as apiSendMessage } from '../lib/api'

type Mode = 'free' | 'scenario' | 'repeat'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SCENARIOS = [
  { id: 'intro', label: 'Self Introduction', prompt: 'Let\'s practice self-introductions. Start by asking me to introduce myself.' },
  { id: 'shopping', label: 'Shopping', prompt: 'We are in a Japanese store. I am the customer, you are the shop assistant. Start the roleplay.' },
  { id: 'directions', label: 'Asking Directions', prompt: 'Help me practice asking for directions in Japanese. I will ask you how to get somewhere.' },
  { id: 'restaurant', label: 'At a Restaurant', prompt: 'We are at a Japanese restaurant. You are the waiter. Let\'s roleplay ordering food.' },
  { id: 'weather', label: 'Talking About Weather', prompt: 'Let\'s have a casual conversation about the weather in Japanese.' }
]

const INITIAL_MESSAGE: Message = {
  id: '0',
  role: 'assistant',
  content: 'こんにちは！(Hello!) 私はケイタです。(I\'m Keita.) 今日は何を練習しますか？(What would you like to practice today?) 日本語を話しましょう！(Let\'s speak Japanese!)',
  timestamp: new Date()
}

export default function Conversation() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<Mode>('free')
  const [listening, setListening] = useState(false)
  const [showTranslation, setShowTranslation] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)
  const [speechPaused, setSpeechPaused] = useState(false)
  const stopListeningRef = useRef<((cancel?: boolean) => void) | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    initSpeech().catch(() => {})
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function toggleTranslation(id: string) {
    setShowTranslation(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function handleSpeak(msgId: string, text: string) {
    // If already speaking this message, stop it
    if (speakingMsgId === msgId) {
      stopSpeech()
      setSpeakingMsgId(null)
      setSpeechPaused(false)
      return
    }
    setSpeakingMsgId(msgId)
    setSpeechPaused(false)
    speakJapanese(text, true, () => {
      setSpeakingMsgId(null)
      setSpeechPaused(false)
    })
  }

  function handlePauseResume() {
    if (speechPaused) {
      resumeSpeech()
      setSpeechPaused(false)
    } else {
      pauseSpeech()
      setSpeechPaused(true)
    }
  }

  function extractJapanese(text: string): string {
    return text
      .split('\n')
      .filter(line => !line.trim().startsWith('|') && !line.trim().startsWith('---'))  // strip table rows
      .join(' ')
      .replace(/\{([^|{}]+)\|[^|{}]+\}/g, '$1') // {漢字|かんじ} → 漢字
      .replace(/\([^)]+\)/g, '')      // strip (English translations)
      .replace(/\*\*?([^*]+)\*\*?/g, '$1') // strip **bold** / *italic*
      .replace(/#{1,6}\s?/g, '')      // strip # headers
      .replace(/`[^`]*`/g, '')        // strip `code`
      .replace(/\s{2,}/g, ' ')        // collapse whitespace
      .trim()
  }

  function renderWithFurigana(text: string): React.ReactNode {
    const parts = text.split(/(\{[^|{}]+\|[^|{}]+\})/g)
    return parts.map((part, i) => {
      const match = part.match(/^\{([^|{}]+)\|([^|{}]+)\}$/)
      if (match) {
        return <ruby key={i}>{match[1]}<rt>{match[2]}</rt></ruby>
      }
      return <span key={i}>{part}</span>
    })
  }

  function extractEnglish(text: string): string {
    const matches = text.match(/\(([^)]+)\)/g)
    if (!matches) return ''
    return matches.map(m => m.slice(1, -1)).join(' ')
  }

  async function sendMessage(content: string, autoPlay = false) {
    if (!content.trim() || loading) return

    setError(null)
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const apiMessages = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content
    }))

    // Add mode-specific context if needed
    if (mode === 'scenario' && messages.length === 1) {
      const scenario = SCENARIOS[0]
      apiMessages[0] = {
        role: 'user',
        content: scenario.prompt + '\n\n' + content
      }
    }

    try {
      const result = await apiSendMessage(apiMessages) as { content?: string; error?: string }

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.content || '',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMsg])

      if (autoPlay && assistantMsg.content) {
        setSpeakingMsgId(assistantMsg.id)
        setSpeechPaused(false)
        speakJapanese(assistantMsg.content, true, () => {
          setSpeakingMsgId(null)
          setSpeechPaused(false)
        })
      }
    } catch (err) {
      setError('Failed to connect to Claude. Please check your API key.')
    } finally {
      setLoading(false)
    }
  }

  function handleCancelRecording() {
    stopListeningRef.current?.(true) // true = cancel, discard audio
    stopListeningRef.current = null
    setListening(false)
  }

  function handleMicPress() {
    if (listening) {
      // Stop recording — keep listening=true while Azure transcribes
      stopListeningRef.current?.()
      stopListeningRef.current = null
      return
    }

    if (!hasSpeechRecognition()) {
      setError('Microphone not available.')
      return
    }

    setListening(true)
    const stop = startListening(
      (text) => {
        setInput(text)
        setListening(false)
        stopListeningRef.current = null
        if (text.trim()) {
          sendMessage(text, true)
        }
      },
      () => {
        setListening(false)
        stopListeningRef.current = null
      },
      'ja-JP'
    )
    stopListeningRef.current = stop
  }

  function handleScenarioSelect(scenario: typeof SCENARIOS[0]) {
    setMessages([INITIAL_MESSAGE])
    setMode('scenario')
    setTimeout(() => {
      sendMessage(`[Scenario: ${scenario.label}] ${scenario.prompt}`)
    }, 100)
  }

  function clearConversation() {
    stopSpeech()
    setSpeakingMsgId(null)
    setSpeechPaused(false)
    setMessages([INITIAL_MESSAGE])
    setError(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Coming Soon overlay */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center fade-in">
        <div className="inline-block px-5 py-2 rounded-full text-base font-bold bg-[#4A6FA5]/20 text-[#4A6FA5] border-2 border-[#4A6FA5]/50 mb-6 tracking-wide">
          🚧 Coming Soon
        </div>
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          AI Conversation
        </h2>
        <p className="max-w-xs leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
          Chat with <strong>Keita</strong>, your AI Japanese friend. Practice real conversations, work through scenarios, and build speaking confidence — all at N5 level.
        </p>
        <div className="space-y-2 text-sm w-full max-w-xs text-left">
          {[
            { icon: '🗣️', label: 'Free Talk', desc: 'Open-ended conversation practice' },
            { icon: '🎭', label: 'Scenarios', desc: 'Restaurant, shopping, directions...' },
            { icon: '🔁', label: 'Repeat Mode', desc: 'Shadowing for pronunciation' },
            { icon: '🎤', label: 'Voice Input', desc: 'Speak Japanese out loud' }
          ].map(f => (
            <div key={f.label} className="flex items-start gap-3 rounded-lg p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <span className="text-xl shrink-0">{f.icon}</span>
              <div>
                <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{f.label}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden header — keeps the component functional for future use */}
      <div className="hidden">
      {/* Header */}
      <div className="border-b border-slate-800 px-4 py-3 shrink-0">
        {/* Row 1: Keita info */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#6A994E] flex items-center justify-center text-white font-bold shrink-0">
              K
            </div>
            <div>
              <h2 className="text-white font-semibold">Keita</h2>
              <p className="text-slate-500 text-xs">AI Japanese Tutor · N5 Level</p>
            </div>
          </div>
          <button
            onClick={clearConversation}
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors px-2 py-1"
          >
            Clear
          </button>
        </div>
        {/* Row 2: Mode tabs */}
        <div className="flex bg-[#1a1a2e] rounded-lg p-1 gap-1">
          {(['free', 'scenario', 'repeat'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                mode === m ? 'bg-[#4A6FA5] text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m === 'free' ? 'Free Talk' : m === 'scenario' ? 'Scenario' : 'Repeat'}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario picker */}
      {mode === 'scenario' && (
        <div className="border-b border-slate-800 px-6 py-3 flex gap-2 overflow-x-auto shrink-0">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => handleScenarioSelect(s)}
              className="shrink-0 px-3 py-1.5 bg-[#1a1a2e] hover:bg-slate-700 text-slate-300 text-sm rounded-full border border-slate-700 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-3 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-400">✕</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} fade-in`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-[#6A994E] flex items-center justify-center text-white text-sm font-bold mr-3 shrink-0 mt-1">
                K
              </div>
            )}

            <div className={`max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div
                className={`rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-[#4A6FA5] text-white rounded-br-sm'
                    : 'bg-[#1a1a2e] text-slate-200 rounded-bl-sm border border-slate-700'
                }`}
              >
                <p className="text-base leading-relaxed japanese-text whitespace-pre-wrap">
                  {msg.role === 'assistant' ? renderWithFurigana(msg.content) : msg.content}
                </p>
              </div>

              {/* Assistant message actions */}
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-3 mt-1.5 px-1">
                  <button
                    onClick={() => handleSpeak(msg.id, msg.content)}
                    className={`text-xs flex items-center gap-1 transition-colors ${
                      speakingMsgId === msg.id
                        ? 'text-[#BC4749] hover:text-red-400'
                        : 'text-slate-600 hover:text-[#4A6FA5]'
                    }`}
                  >
                    {speakingMsgId === msg.id ? '⏹ Stop' : '🔊 Speak'}
                  </button>
                  {speakingMsgId === msg.id && (
                    <button
                      onClick={handlePauseResume}
                      className="text-xs text-slate-600 hover:text-[#E8A838] transition-colors"
                    >
                      {speechPaused ? '▶ Resume' : '⏸ Pause'}
                    </button>
                  )}
                  <button
                    onClick={() => toggleTranslation(msg.id)}
                    className="text-slate-600 hover:text-slate-400 text-xs transition-colors"
                  >
                    {showTranslation[msg.id] ? 'Hide EN' : 'Show EN'}
                  </button>
                </div>
              )}

              {/* Translation reveal */}
              {msg.role === 'assistant' && showTranslation[msg.id] && (
                <div className="mt-1 px-1">
                  <p className="text-slate-400 text-xs italic">{extractEnglish(msg.content) || msg.content}</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-[#6A994E] flex items-center justify-center text-white text-sm font-bold mr-3 shrink-0">
              K
            </div>
            <div className="bg-[#1a1a2e] border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-slate-800 px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          {/* Mic button */}
          <button
            onClick={handleMicPress}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150 shrink-0 ${
              listening
                ? 'bg-red-600 hover:bg-red-500 scale-110 shadow-lg shadow-red-900/40'
                : 'bg-[#1a1a2e] hover:bg-slate-700 border border-slate-700'
            }`}
            title={listening ? 'Click to send' : 'Click to speak'}
          >
            {listening ? (
              <span className="text-white text-base animate-pulse">⬛</span>
            ) : (
              <span className="text-slate-400 text-base">🎤</span>
            )}
          </button>

          {/* Cancel recording button — only visible while recording */}
          {listening && (
            <button
              onClick={handleCancelRecording}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-[#1a1a2e] border border-slate-700 hover:border-red-700 hover:text-red-400 text-slate-500 transition-all duration-150 shrink-0 text-sm font-bold"
              title="Cancel recording — discard audio"
            >
              ✕
            </button>
          )}

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={listening ? '🎤 Listening...' : input}
            onChange={e => !listening && setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder="Type in Japanese or English... (または日本語で話しかけてください)"
            disabled={listening || loading}
            className="flex-1 bg-[#1a1a2e] border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#4A6FA5] transition-colors text-sm"
          />

          {/* Send button */}
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading || listening}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150 shrink-0 ${
              input.trim() && !loading
                ? 'bg-[#4A6FA5] hover:bg-blue-500 text-white'
                : 'bg-[#1a1a2e] border border-slate-700 text-slate-600 cursor-not-allowed'
            }`}
          >
            ➤
          </button>
        </div>

        <p className="text-slate-600 text-xs mt-2 text-center">
          {hasSpeechRecognition()
            ? 'Click 🎤 to speak · Type and press Enter to send'
            : 'Type your message and press Enter to send'}
        </p>
      </div>
      </div>{/* end hidden */}
    </div>
  )
}
