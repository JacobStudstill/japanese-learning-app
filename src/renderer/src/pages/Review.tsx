import { useState, useEffect, useCallback } from 'react'
import { calculateNextReview, formatNextReview } from '../lib/srs'
import { speakJapanese, initSpeech } from '../lib/speech'
import { getDueCards, getNewCards, reviewCard as apiReviewCard } from '../lib/api'

interface Card {
  id: number
  vocab_id: number
  card_type: 'meaning' | 'reading'
  interval: number
  ease_factor: number
  repetitions: number
  due_date: string
  status: string
  word: string
  reading: string
  meaning: string
  example_sentence?: string
  example_reading?: string
  example_meaning?: string
  part_of_speech?: string
}

interface Props {
  onComplete: () => void
}

interface SessionStats {
  again: number
  hard: number
  good: number
  easy: number
  total: number
}

export default function Review({ onComplete }: Props) {
  const [cards, setCards] = useState<Card[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)
  const [stats, setStats] = useState<SessionStats>({ again: 0, hard: 0, good: 0, easy: 0, total: 0 })
  const [showRomaji, setShowRomaji] = useState(false)

  useEffect(() => {
    loadCards()
    initSpeech().catch(() => {})
  }, [])

  async function loadCards() {
    try {
      const due = await getDueCards() as Card[]
      const fresh = await getNewCards(5) as Card[]

      // Merge, dedup by id, shuffle
      const all = [...due]
      for (const c of fresh) {
        if (!all.find(x => x.id === c.id)) all.push(c)
      }

      // Shuffle
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]]
      }

      setCards(all)
      setLoading(false)
      if (all.length === 0) setDone(true)
    } catch (err) {
      console.error(err)
      setLoading(false)
      setDone(true)
    }
  }

  const currentCard = cards[currentIndex]

  function speak() {
    if (!currentCard) return
    speakJapanese(currentCard.word)
  }

  function speakSentence() {
    if (!currentCard?.example_sentence) return
    speakJapanese(currentCard.example_sentence, true)
  }

  async function handleRating(rating: 1 | 2 | 3 | 4) {
    if (!currentCard) return

    const update = calculateNextReview(
      rating,
      currentCard.interval,
      currentCard.ease_factor,
      currentCard.repetitions
    )

    try {
      await apiReviewCard({
        id: currentCard.id,
        rating,
        interval: update.interval,
        easeFactor: update.easeFactor,
        repetitions: update.repetitions,
        dueDate: update.dueDate,
        status: update.status
      })
    } catch (err) {
      console.error(err)
    }

    // Update session stats
    setStats(prev => ({
      ...prev,
      again: rating === 1 ? prev.again + 1 : prev.again,
      hard: rating === 2 ? prev.hard + 1 : prev.hard,
      good: rating === 3 ? prev.good + 1 : prev.good,
      easy: rating === 4 ? prev.easy + 1 : prev.easy,
      total: prev.total + 1
    }))

    // Move to next card
    const next = currentIndex + 1
    if (next >= cards.length) {
      setDone(true)
      onComplete()
    } else {
      setCurrentIndex(next)
      setShowAnswer(false)
      setShowRomaji(false)
    }
  }

  useKeyPress('Space', () => {
    if (!showAnswer) setShowAnswer(true)
  })

  useKeyPress('1', () => { if (showAnswer) handleRating(1) })
  useKeyPress('2', () => { if (showAnswer) handleRating(2) })
  useKeyPress('3', () => { if (showAnswer) handleRating(3) })
  useKeyPress('4', () => { if (showAnswer) handleRating(4) })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400 text-lg">Loading cards...</div>
      </div>
    )
  }

  if (done) {
    const accuracy = stats.total > 0 ? Math.round(((stats.good + stats.easy) / stats.total) * 100) : 0
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="card-surface p-10 max-w-md w-full text-center fade-in">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Session Complete!</h2>
          <p className="text-slate-400 mb-8">お疲れ様でした！</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-[#0f0f1a] rounded-lg p-4">
              <div className="text-3xl font-bold text-white">{stats.total}</div>
              <div className="text-slate-500 text-sm">Cards reviewed</div>
            </div>
            <div className="bg-[#0f0f1a] rounded-lg p-4">
              <div className="text-3xl font-bold text-[#6A994E]">{accuracy}%</div>
              <div className="text-slate-500 text-sm">Accuracy</div>
            </div>
          </div>

          <div className="flex gap-2 justify-center mb-6 text-sm">
            <span className="bg-red-900/40 text-red-400 px-3 py-1 rounded-full">Again: {stats.again}</span>
            <span className="bg-orange-900/40 text-orange-400 px-3 py-1 rounded-full">Hard: {stats.hard}</span>
            <span className="bg-green-900/40 text-green-400 px-3 py-1 rounded-full">Good: {stats.good}</span>
            <span className="bg-blue-900/40 text-blue-400 px-3 py-1 rounded-full">Easy: {stats.easy}</span>
          </div>

          <button
            onClick={() => { setDone(false); setCurrentIndex(0); setStats({ again: 0, hard: 0, good: 0, easy: 0, total: 0 }); loadCards() }}
            className="btn-primary w-full"
          >
            Review More
          </button>
        </div>
      </div>
    )
  }

  const progress = Math.round((currentIndex / cards.length) * 100)
  const isMeaning = currentCard?.card_type === 'meaning'

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-3 shrink-0">
        <div className="flex justify-between text-slate-400 text-sm mb-2">
          <span>{currentIndex + 1} / {cards.length}</span>
          <span className="capitalize">{currentCard?.card_type} card</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5">
          <div
            className="bg-[#4A6FA5] h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card — scrollable so answer + buttons are always reachable */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6">
      <div className="flex flex-col items-center max-w-2xl mx-auto w-full pt-2">
        <div className="card-surface w-full p-8 mb-6 text-center flip-in">
          {/* Card front */}
          <div className="mb-4">
            <span className="text-xs uppercase tracking-widest text-slate-500 font-medium">
              {isMeaning ? 'What does this mean?' : 'How do you read this?'}
            </span>
          </div>

          {isMeaning ? (
            /* Show word, ask for meaning */
            <div>
              <div className="text-6xl font-bold text-white japanese-text mb-3">
                {currentCard?.word}
              </div>
              {showRomaji && (
                <div className="text-slate-400 text-xl japanese-text">{currentCard?.reading}</div>
              )}
            </div>
          ) : (
            /* Show meaning, ask for reading */
            <div>
              <div className="text-3xl font-semibold text-slate-200 mb-3">
                {currentCard?.meaning}
              </div>
              <div className="text-slate-500 text-sm">{currentCard?.part_of_speech}</div>
            </div>
          )}

          {/* Speak button */}
          <button
            onClick={speak}
            className="mt-4 text-slate-500 hover:text-[#4A6FA5] transition-colors text-sm flex items-center gap-1 mx-auto"
          >
            🔊 Listen
          </button>

          {/* Romaji toggle */}
          {isMeaning && (
            <button
              onClick={() => setShowRomaji(!showRomaji)}
              className="mt-2 text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              {showRomaji ? 'Hide reading' : 'Show reading'}
            </button>
          )}
        </div>

        {/* Show Answer button */}
        {!showAnswer && (
          <button
            onClick={() => setShowAnswer(true)}
            className="btn-secondary px-12 py-3 text-base"
          >
            Show Answer <span className="text-slate-500 text-sm ml-2">[Space]</span>
          </button>
        )}

        {/* Answer revealed */}
        {showAnswer && (
          <div className="w-full fade-in">
            {/* Answer card */}
            <div className="card-surface p-6 mb-4 border-slate-700">
              {isMeaning ? (
                <div>
                  <div className="text-3xl font-bold text-[#6A994E] mb-2">{currentCard?.meaning}</div>
                  <div className="text-slate-400 japanese-text text-xl">{currentCard?.reading}</div>
                  <div className="text-slate-500 text-sm mt-1">{currentCard?.part_of_speech}</div>
                </div>
              ) : (
                <div>
                  <div className="text-5xl font-bold text-white japanese-text mb-2">{currentCard?.word}</div>
                  <div className="text-[#6A994E] text-2xl japanese-text">{currentCard?.reading}</div>
                </div>
              )}

              {/* Example sentence */}
              {currentCard?.example_sentence && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-slate-300 japanese-text text-lg mb-1">{currentCard.example_sentence}</div>
                      {currentCard.example_reading && (
                        <div className="text-slate-500 japanese-text text-base mb-1">{currentCard.example_reading}</div>
                      )}
                      {currentCard.example_meaning && (
                        <div className="text-slate-400 text-base italic">{currentCard.example_meaning}</div>
                      )}
                    </div>
                    <button onClick={speakSentence} className="text-slate-600 hover:text-[#4A6FA5] ml-3 shrink-0">
                      🔊
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Rating buttons */}
            <div className="grid grid-cols-4 gap-3">
              {([1, 2, 3, 4] as const).map(rating => {
                const labels = { 1: 'Again', 2: 'Hard', 3: 'Good', 4: 'Easy' }
                const colors = {
                  1: 'bg-red-700 hover:bg-red-600',
                  2: 'bg-orange-700 hover:bg-orange-600',
                  3: 'bg-green-700 hover:bg-green-600',
                  4: 'bg-blue-700 hover:bg-blue-600'
                }
                const preview = calculateNextReview(rating, currentCard.interval, currentCard.ease_factor, currentCard.repetitions)
                return (
                  <button
                    key={rating}
                    onClick={() => handleRating(rating)}
                    className={`${colors[rating]} text-white rounded-lg py-3 px-2 transition-all duration-150 active:scale-95 flex flex-col items-center gap-1`}
                  >
                    <span className="font-bold text-sm">{labels[rating]}</span>
                    <span className="text-xs opacity-70">[{rating}] {formatNextReview(preview.interval)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

// Keyboard shortcut hook
function useKeyPress(key: string, callback: () => void) {
  const cb = useCallback(callback, [callback])
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === key || (key === 'Space' && e.code === 'Space')) {
        e.preventDefault()
        cb()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, cb])
}
