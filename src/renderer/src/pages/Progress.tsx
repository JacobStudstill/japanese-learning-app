import { useState, useEffect } from 'react'
import { getProfile, getVocab, getAllCards } from '../lib/api'

interface Profile {
  streak: number
  xp: number
  level: number
  last_study_date: string | null
  daily_new_cards: number
  created_at: string
}

interface VocabItem {
  id: number
  word: string
  reading: string
  meaning: string
  part_of_speech: string
}

interface SrsCard {
  id: number
  vocab_id: number
  card_type: string
  interval: number
  repetitions: number
  status: string
}

interface Stats {
  totalVocab: number
  masteredCards: number
  learningCards: number
  newCards: number
  currentStreak: number
  totalXP: number
  level: number
}

const MASTERY_COLORS: Record<string, string> = {
  new: '#1e293b',
  learning: '#E8A838',
  review: '#4A6FA5',
  mastered: '#6A994E'
}

function getMasteryStatus(card: SrsCard): 'new' | 'learning' | 'review' | 'mastered' {
  if (card.status === 'new') return 'new'
  if (card.status === 'learning') return 'learning'
  if (card.interval >= 21) return 'mastered'
  return 'review'
}

export default function Progress() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [cards, setCards] = useState<SrsCard[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'mastered' | 'learning' | 'new'>('all')

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    try {
      const [p, v, c] = await Promise.all([
        getProfile(),
        getVocab(),
        getAllCards()
      ])
      const prof = p as Profile
      const vocabList = v as VocabItem[]
      const cardList = c as SrsCard[]
      setProfile(prof)
      setVocab(vocabList)
      setCards(cardList)
      setStats({
        totalVocab: vocabList.length,
        masteredCards: cardList.filter(c => c.interval >= 21).length,
        learningCards: cardList.filter(c => c.status === 'learning').length,
        newCards: cardList.filter(c => c.status === 'new').length,
        currentStreak: prof.streak,
        totalXP: prof.xp,
        level: prof.level
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  const xpForCurrentLevel = profile ? (profile.level - 1) * 1000 : 0
  const xpForNextLevel = profile ? profile.level * 1000 : 1000
  const xpProgress = profile ? profile.xp - xpForCurrentLevel : 0
  const xpNeeded = xpForNextLevel - xpForCurrentLevel
  const xpPercent = Math.min(100, Math.round((xpProgress / xpNeeded) * 100))

  // Build a map of vocab_id → mastery status from cards
  const cardStatusByVocabId: Record<number, 'new' | 'learning' | 'review' | 'mastered'> = {}
  for (const c of cards) {
    const existing = cardStatusByVocabId[c.vocab_id]
    const status = getMasteryStatus(c)
    // Promote to highest status seen across card types for this vocab
    const rank = { new: 0, learning: 1, review: 2, mastered: 3 }
    if (!existing || rank[status] > rank[existing]) {
      cardStatusByVocabId[c.vocab_id] = status
    }
  }

  const filteredVocab = vocab.filter(v => {
    if (filter === 'all') return true
    const status = cardStatusByVocabId[v.id] ?? 'new'
    if (filter === 'mastered') return status === 'mastered'
    if (filter === 'learning') return status === 'learning' || status === 'review'
    if (filter === 'new') return status === 'new'
    return true
  })

  const byPOS: Record<string, VocabItem[]> = {}
  for (const v of vocab) {
    const pos = v.part_of_speech || 'other'
    if (!byPOS[pos]) byPOS[pos] = []
    byPOS[pos].push(v)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-1">Progress</h2>
        <p className="text-slate-400">Your Japanese learning journey</p>
      </div>

      {/* Level & XP */}
      <div className="card-surface p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-slate-400 text-sm uppercase tracking-wide mb-1">Current Level</div>
            <div className="text-4xl font-bold text-[#E8A838]">Level {profile?.level}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-sm">Total XP</div>
            <div className="text-2xl font-bold text-white">{profile?.xp?.toLocaleString()}</div>
          </div>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-sm text-slate-400 mb-1">
            <span>Progress to Level {(profile?.level || 1) + 1}</span>
            <span>{xpProgress} / {xpNeeded} XP</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3">
            <div
              className="bg-[#E8A838] h-3 rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card-surface p-4 text-center">
          <div className="text-3xl font-bold text-[#E8A838] mb-1">{profile?.streak || 0}</div>
          <div className="text-slate-400 text-xs">Day Streak 🔥</div>
        </div>
        <div className="card-surface p-4 text-center">
          <div className="text-3xl font-bold text-[#6A994E] mb-1">{vocab.length}</div>
          <div className="text-slate-400 text-xs">Total Vocab</div>
        </div>
        <div className="card-surface p-4 text-center">
          <div className="text-3xl font-bold text-[#4A6FA5] mb-1">{profile?.daily_new_cards || 15}</div>
          <div className="text-slate-400 text-xs">Daily New Cards</div>
        </div>
        <div className="card-surface p-4 text-center">
          <div className="text-3xl font-bold text-white mb-1">
            {profile?.last_study_date
              ? new Date(profile.last_study_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : '—'
            }
          </div>
          <div className="text-slate-400 text-xs">Last Study</div>
        </div>
      </div>

      {/* Vocabulary breakdown by part of speech */}
      <div className="card-surface p-6 mb-6">
        <h3 className="text-white font-semibold mb-4">Vocabulary by Category</h3>
        <div className="space-y-3">
          {Object.entries(byPOS).map(([pos, items]) => {
            const pct = Math.round((items.length / vocab.length) * 100)
            const colors: Record<string, string> = {
              verb: '#BC4749',
              noun: '#4A6FA5',
              'i-adjective': '#6A994E',
              'na-adjective': '#6A994E',
              pronoun: '#E8A838',
              number: '#9b59b6',
              other: '#7f8c8d'
            }
            const color = colors[pos] || '#7f8c8d'
            return (
              <div key={pos}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300 capitalize">{pos}</span>
                  <span className="text-slate-500">{items.length} words ({pct}%)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Vocabulary list */}
      <div className="card-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">
            {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)} Vocabulary ({filteredVocab.length})
          </h3>
          <div className="flex gap-2">
            {(['all', 'mastered', 'learning', 'new'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === f
                    ? 'bg-[#4A6FA5] text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          {filteredVocab.map(v => (
            <div
              key={v.id}
              className="bg-[#0f0f1a] rounded-lg p-3 border border-slate-800 flex items-start gap-3"
            >
              <div
                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: MASTERY_COLORS[cardStatusByVocabId[v.id] ?? 'new'] }}
              />
              <div>
                <div className="text-white font-medium japanese-text text-sm">{v.word}</div>
                <div className="text-slate-500 text-xs japanese-text">{v.reading}</div>
                <div className="text-slate-400 text-xs mt-0.5">{v.meaning}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
