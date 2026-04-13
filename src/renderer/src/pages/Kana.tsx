import { useState, useEffect, useRef } from 'react'

type Script = 'hiragana' | 'katakana' | 'both'
type AppMode = 'study' | 'quiz'
type Feedback = 'correct' | 'wrong' | null

interface KanaChar {
  kana: string
  romaji: string
  alt?: string[]
}

interface KanaRow {
  id: string
  label: string
  hiragana: (KanaChar | null)[]
  katakana: (KanaChar | null)[]
}

const ROWS: KanaRow[] = [
  { id: 'vowels', label: 'Vowels',
    hiragana: [{ kana: 'あ', romaji: 'a' }, { kana: 'い', romaji: 'i' }, { kana: 'う', romaji: 'u' }, { kana: 'え', romaji: 'e' }, { kana: 'お', romaji: 'o' }],
    katakana: [{ kana: 'ア', romaji: 'a' }, { kana: 'イ', romaji: 'i' }, { kana: 'ウ', romaji: 'u' }, { kana: 'エ', romaji: 'e' }, { kana: 'オ', romaji: 'o' }]
  },
  { id: 'k', label: 'K',
    hiragana: [{ kana: 'か', romaji: 'ka' }, { kana: 'き', romaji: 'ki' }, { kana: 'く', romaji: 'ku' }, { kana: 'け', romaji: 'ke' }, { kana: 'こ', romaji: 'ko' }],
    katakana: [{ kana: 'カ', romaji: 'ka' }, { kana: 'キ', romaji: 'ki' }, { kana: 'ク', romaji: 'ku' }, { kana: 'ケ', romaji: 'ke' }, { kana: 'コ', romaji: 'ko' }]
  },
  { id: 's', label: 'S',
    hiragana: [{ kana: 'さ', romaji: 'sa' }, { kana: 'し', romaji: 'shi', alt: ['si'] }, { kana: 'す', romaji: 'su' }, { kana: 'せ', romaji: 'se' }, { kana: 'そ', romaji: 'so' }],
    katakana: [{ kana: 'サ', romaji: 'sa' }, { kana: 'シ', romaji: 'shi', alt: ['si'] }, { kana: 'ス', romaji: 'su' }, { kana: 'セ', romaji: 'se' }, { kana: 'ソ', romaji: 'so' }]
  },
  { id: 't', label: 'T',
    hiragana: [{ kana: 'た', romaji: 'ta' }, { kana: 'ち', romaji: 'chi', alt: ['ti'] }, { kana: 'つ', romaji: 'tsu', alt: ['tu'] }, { kana: 'て', romaji: 'te' }, { kana: 'と', romaji: 'to' }],
    katakana: [{ kana: 'タ', romaji: 'ta' }, { kana: 'チ', romaji: 'chi', alt: ['ti'] }, { kana: 'ツ', romaji: 'tsu', alt: ['tu'] }, { kana: 'テ', romaji: 'te' }, { kana: 'ト', romaji: 'to' }]
  },
  { id: 'n', label: 'N',
    hiragana: [{ kana: 'な', romaji: 'na' }, { kana: 'に', romaji: 'ni' }, { kana: 'ぬ', romaji: 'nu' }, { kana: 'ね', romaji: 'ne' }, { kana: 'の', romaji: 'no' }],
    katakana: [{ kana: 'ナ', romaji: 'na' }, { kana: 'ニ', romaji: 'ni' }, { kana: 'ヌ', romaji: 'nu' }, { kana: 'ネ', romaji: 'ne' }, { kana: 'ノ', romaji: 'no' }]
  },
  { id: 'h', label: 'H',
    hiragana: [{ kana: 'は', romaji: 'ha' }, { kana: 'ひ', romaji: 'hi' }, { kana: 'ふ', romaji: 'fu', alt: ['hu'] }, { kana: 'へ', romaji: 'he' }, { kana: 'ほ', romaji: 'ho' }],
    katakana: [{ kana: 'ハ', romaji: 'ha' }, { kana: 'ヒ', romaji: 'hi' }, { kana: 'フ', romaji: 'fu', alt: ['hu'] }, { kana: 'ヘ', romaji: 'he' }, { kana: 'ホ', romaji: 'ho' }]
  },
  { id: 'm', label: 'M',
    hiragana: [{ kana: 'ま', romaji: 'ma' }, { kana: 'み', romaji: 'mi' }, { kana: 'む', romaji: 'mu' }, { kana: 'め', romaji: 'me' }, { kana: 'も', romaji: 'mo' }],
    katakana: [{ kana: 'マ', romaji: 'ma' }, { kana: 'ミ', romaji: 'mi' }, { kana: 'ム', romaji: 'mu' }, { kana: 'メ', romaji: 'me' }, { kana: 'モ', romaji: 'mo' }]
  },
  { id: 'y', label: 'Y',
    hiragana: [{ kana: 'や', romaji: 'ya' }, null, { kana: 'ゆ', romaji: 'yu' }, null, { kana: 'よ', romaji: 'yo' }],
    katakana: [{ kana: 'ヤ', romaji: 'ya' }, null, { kana: 'ユ', romaji: 'yu' }, null, { kana: 'ヨ', romaji: 'yo' }]
  },
  { id: 'r', label: 'R',
    hiragana: [{ kana: 'ら', romaji: 'ra' }, { kana: 'り', romaji: 'ri' }, { kana: 'る', romaji: 'ru' }, { kana: 'れ', romaji: 're' }, { kana: 'ろ', romaji: 'ro' }],
    katakana: [{ kana: 'ラ', romaji: 'ra' }, { kana: 'リ', romaji: 'ri' }, { kana: 'ル', romaji: 'ru' }, { kana: 'レ', romaji: 're' }, { kana: 'ロ', romaji: 'ro' }]
  },
  { id: 'w', label: 'W',
    hiragana: [{ kana: 'わ', romaji: 'wa' }, null, null, null, { kana: 'を', romaji: 'wo', alt: ['o'] }],
    katakana: [{ kana: 'ワ', romaji: 'wa' }, null, null, null, { kana: 'ヲ', romaji: 'wo', alt: ['o'] }]
  },
  { id: 'solo-n', label: 'ん',
    hiragana: [{ kana: 'ん', romaji: 'n', alt: ['nn'] }, null, null, null, null],
    katakana: [{ kana: 'ン', romaji: 'n', alt: ['nn'] }, null, null, null, null]
  },
]

const COL_LABELS = ['a', 'i', 'u', 'e', 'o']
const ALL_ROW_IDS = new Set(ROWS.map(r => r.id))

type PoolItem = { kana: string; romaji: string; alt?: string[] }

function buildPool(script: Script, selectedRowIds: Set<string>): PoolItem[] {
  const pool: PoolItem[] = []
  for (const row of ROWS) {
    if (!selectedRowIds.has(row.id)) continue
    if (script === 'hiragana' || script === 'both') {
      for (const ch of row.hiragana) { if (ch) pool.push(ch) }
    }
    if (script === 'katakana' || script === 'both') {
      for (const ch of row.katakana) { if (ch) pool.push(ch) }
    }
  }
  return pool
}

function isCorrect(input: string, item: PoolItem): boolean {
  const v = input.trim().toLowerCase()
  return v === item.romaji || (item.alt?.includes(v) ?? false)
}

function pickRandom(pool: PoolItem[]): PoolItem {
  return pool[Math.floor(Math.random() * pool.length)]
}

export default function Kana() {
  const [script, setScript] = useState<Script>('hiragana')
  const [mode, setMode] = useState<AppMode>('study')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set(ALL_ROW_IDS))

  // Quiz state
  const [pool, setPool] = useState<PoolItem[]>([])
  const [current, setCurrent] = useState<PoolItem | null>(null)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const inputRef = useRef<HTMLInputElement>(null)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Keep latest feedback/pool/current in refs so event handlers never go stale
  const feedbackRef = useRef<Feedback>(null)
  const poolRef = useRef<PoolItem[]>([])
  const currentRef = useRef<PoolItem | null>(null)
  const inputValRef = useRef('')

  // Sync refs with state
  useEffect(() => { feedbackRef.current = feedback }, [feedback])
  useEffect(() => { poolRef.current = pool }, [pool])
  useEffect(() => { currentRef.current = current }, [current])
  useEffect(() => { inputValRef.current = input }, [input])

  // Rebuild pool when script/rows/mode change
  useEffect(() => {
    if (mode !== 'quiz') return
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    const p = buildPool(script, selectedRows)
    poolRef.current = p
    setPool(p)
    const first = p.length > 0 ? pickRandom(p) : null
    setCurrent(first)
    currentRef.current = first
    setInput('')
    inputValRef.current = ''
    setFeedback(null)
    feedbackRef.current = null
    setCorrectAnswer('')
    setScore({ correct: 0, total: 0 })
  }, [script, selectedRows, mode])

  // Focus input when quiz first loads
  useEffect(() => {
    if (mode === 'quiz') {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [mode])

  function advanceToNext() {
    const p = poolRef.current
    if (p.length === 0) return
    const next = pickRandom(p)
    setCurrent(next)
    currentRef.current = next
    setInput('')
    inputValRef.current = ''
    setFeedback(null)
    feedbackRef.current = null
    setCorrectAnswer('')
    // Keep keyboard up on mobile — refocus without delay
    inputRef.current?.focus()
  }

  function submitAnswer() {
    const fb = feedbackRef.current
    const cur = currentRef.current
    const val = inputValRef.current
    if (!cur || fb !== null) return
    const ok = isCorrect(val, cur)
    setScore(s => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }))
    setFeedback(ok ? 'correct' : 'wrong')
    feedbackRef.current = ok ? 'correct' : 'wrong'
    if (!ok) {
      setCorrectAnswer(cur.romaji)
      // Stay focused so user can hit Enter to advance
      inputRef.current?.focus()
    }
    if (ok) {
      advanceTimer.current = setTimeout(advanceToNext, 650)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (feedbackRef.current !== null) return
    setInput(e.target.value)
    inputValRef.current = e.target.value
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (feedbackRef.current === 'wrong') {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
      advanceToNext()
    } else {
      submitAnswer()
    }
  }

  function handleNextClick() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    advanceToNext()
  }

  function toggleRow(id: string) {
    setSelectedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size === 1) return prev
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : null
  const showH = script === 'hiragana' || script === 'both'
  const showK = script === 'katakana' || script === 'both'

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-2xl mx-auto fade-in">

          {/* Page title */}
          <div className="mb-5">
            <h2 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Kana</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Study and test Hiragana & Katakana</p>
          </div>

          {/* Script + Mode toggles */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex rounded-lg p-1 gap-1 flex-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              {(['hiragana', 'katakana', 'both'] as Script[]).map(s => (
                <button
                  key={s}
                  onClick={() => setScript(s)}
                  className="flex-1 py-1.5 rounded-md text-sm font-medium transition-all"
                  style={{
                    background: script === s ? '#4A6FA5' : 'transparent',
                    color: script === s ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  {s === 'hiragana' ? 'Hiragana' : s === 'katakana' ? 'Katakana' : 'Both'}
                </button>
              ))}
            </div>
            <div className="flex rounded-lg p-1 gap-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              {(['study', 'quiz'] as AppMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="px-5 py-1.5 rounded-md text-sm font-medium transition-all"
                  style={{
                    background: mode === m ? '#E8A838' : 'transparent',
                    color: mode === m ? '#0f0f1a' : 'var(--text-secondary)'
                  }}
                >
                  {m === 'study' ? '📖 Study' : '✏️ Quiz'}
                </button>
              ))}
            </div>
          </div>

          {/* ── STUDY MODE ─────────────────────────────────────────────── */}
          {mode === 'study' && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-center" style={{ minWidth: '320px' }}>
                <thead>
                  <tr>
                    <th className="py-2 px-1 text-xs font-semibold w-10" style={{ color: 'var(--text-muted)' }} />
                    {COL_LABELS.map(col => (
                      <th key={col} className="py-2 px-1 text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map(row => (
                    <tr key={row.id} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                      <td className="py-1 px-1 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                        {row.label}
                      </td>
                      {row.hiragana.map((hChar, ci) => {
                        const kChar = row.katakana[ci]
                        if (!hChar && !kChar) return (
                          <td key={ci} className="py-1 px-0.5">
                            <span style={{ color: 'var(--border-subtle)' }}>—</span>
                          </td>
                        )
                        return (
                          <td key={ci} className="py-1 px-0.5">
                            <div
                              className="rounded-lg py-1.5 px-1 inline-flex flex-col items-center min-w-[44px]"
                              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                            >
                              {showH && hChar && (
                                <span className="text-lg md:text-xl leading-tight japanese-text font-medium" style={{ color: 'var(--text-primary)' }}>
                                  {hChar.kana}
                                </span>
                              )}
                              {showK && kChar && (
                                <span className="text-lg md:text-xl leading-tight japanese-text font-medium" style={{ color: script === 'both' ? '#4A6FA5' : 'var(--text-primary)' }}>
                                  {kChar.kana}
                                </span>
                              )}
                              <span className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {(hChar || kChar)?.romaji}
                              </span>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {script === 'both' && (
                <p className="text-xs mt-3 text-center" style={{ color: 'var(--text-muted)' }}>
                  Black = Hiragana · <span style={{ color: '#4A6FA5' }}>Blue = Katakana</span>
                </p>
              )}
            </div>
          )}

          {/* ── QUIZ MODE ──────────────────────────────────────────────── */}
          {mode === 'quiz' && (
            <div>
              {/* Row selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Rows to quiz
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedRows(new Set(ALL_ROW_IDS))} className="text-xs px-2 py-0.5 rounded" style={{ color: '#4A6FA5' }}>All</button>
                    <button onClick={() => setSelectedRows(new Set(['vowels']))} className="text-xs px-2 py-0.5 rounded" style={{ color: 'var(--text-muted)' }}>Vowels only</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ROWS.map(row => (
                    <button
                      key={row.id}
                      onClick={() => toggleRow(row.id)}
                      className="px-3 py-1 rounded-full text-xs font-semibold transition-all active:scale-95"
                      style={{
                        background: selectedRows.has(row.id) ? '#4A6FA5' : 'var(--bg-card)',
                        color: selectedRows.has(row.id) ? '#ffffff' : 'var(--text-secondary)',
                        border: `1px solid ${selectedRows.has(row.id) ? '#4A6FA5' : 'var(--border-subtle)'}`
                      }}
                    >
                      {row.label}
                    </button>
                  ))}
                </div>
              </div>

              {pool.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-center" style={{ color: 'var(--text-muted)' }}>
                  Select at least one row to start quizzing.
                </div>
              ) : (
                <div className="flex flex-col items-center gap-5 max-w-sm mx-auto w-full">

                  {/* Score */}
                  <div className="flex items-center gap-4 text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>
                      {score.correct} / {score.total} correct
                    </span>
                    {accuracy !== null && (
                      <span className="font-bold" style={{ color: accuracy >= 80 ? '#6A994E' : accuracy >= 50 ? '#E8A838' : '#BC4749' }}>
                        {accuracy}%
                      </span>
                    )}
                  </div>

                  {/* Kana card */}
                  <div
                    className="w-full rounded-2xl flex items-center justify-center"
                    style={{
                      background: 'var(--bg-card)',
                      border: `2px solid ${feedback === 'correct' ? '#6A994E' : feedback === 'wrong' ? '#BC4749' : 'var(--border-subtle)'}`,
                      height: '180px',
                      transition: 'border-color 0.15s'
                    }}
                  >
                    <span
                      className="japanese-text font-bold select-none"
                      style={{ fontSize: '7rem', lineHeight: 1, color: 'var(--text-primary)' }}
                    >
                      {current?.kana}
                    </span>
                  </div>

                  {/* Feedback */}
                  <div className="h-7 flex items-center justify-center">
                    {feedback === 'correct' && (
                      <span className="font-semibold text-lg fade-in" style={{ color: '#6A994E' }}>✓ Correct!</span>
                    )}
                    {feedback === 'wrong' && (
                      <span className="font-semibold text-base fade-in" style={{ color: '#BC4749' }}>
                        ✗ Answer: <strong>{correctAnswer}</strong>
                      </span>
                    )}
                  </div>

                  {/* Input — always mounted, never remounted */}
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type romaji..."
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="text"
                    className="w-full text-center text-xl rounded-xl px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-[#4A6FA5]"
                    style={{
                      background: 'var(--bg-input)',
                      borderColor: feedback === 'correct' ? '#6A994E' : feedback === 'wrong' ? '#BC4749' : 'var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  />

                  {/* Action button */}
                  {feedback === null && (
                    <button
                      onClick={submitAnswer}
                      disabled={!input.trim()}
                      className="w-full py-3 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-40"
                      style={{ background: '#4A6FA5' }}
                    >
                      Check <span className="text-xs opacity-60 ml-1">[Enter]</span>
                    </button>
                  )}
                  {feedback === 'wrong' && (
                    <button
                      onClick={handleNextClick}
                      className="w-full py-3 rounded-xl font-semibold text-white transition-all active:scale-95"
                      style={{ background: '#4A6FA5' }}
                    >
                      Next → <span className="text-xs opacity-60 ml-1">[Enter]</span>
                    </button>
                  )}
                  {feedback === 'correct' && (
                    <div className="w-full py-3 rounded-xl text-center font-semibold" style={{ color: '#6A994E', background: '#6A994E15' }}>
                      ✓ Moving on...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
