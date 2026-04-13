import { useState, useEffect } from 'react'
import { getProfile, getDueCount, getTodayStats } from '../lib/api'

type Page = 'dashboard' | 'lessons' | 'review' | 'conversation' | 'progress'

interface Profile {
  id: number
  streak: number
  xp: number
  level: number
  last_study_date: string | null
  daily_new_cards: number
  display_name: string | null
}

interface TodayStats {
  reviewed: number
  correct: number
  accuracy: number
}

interface Props {
  onNavigate: (page: Page) => void
  onRefreshDue: () => void
}

function getMotivationalMessage(streak: number): string {
  if (streak === 0) return 'Start your streak today! 頑張ってください！'
  if (streak === 1) return 'Good start! Keep going tomorrow!'
  if (streak < 7) return `${streak} days in a row! You\'re building a habit!`
  if (streak < 30) return `${streak} day streak! すごい！You\'re on fire!`
  if (streak < 100) return `${streak} days! 素晴らしい！You\'re becoming fluent!`
  return `${streak} day streak! 信じられない！You\'re incredible!`
}

function getLevelTitle(level: number): string {
  if (level < 5) return '初心者 (Beginner)'
  if (level < 10) return '学習者 (Learner)'
  if (level < 20) return '中級者 (Intermediate)'
  return '上級者 (Advanced)'
}

function getGreeting(): { japanese: string; english: string } {
  const hour = parseInt(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/New_York' }).format(new Date()),
    10
  )
  if (hour >= 5 && hour < 12) return { japanese: 'おはようございます！', english: 'Good morning' }
  if (hour >= 12 && hour < 18) return { japanese: 'こんにちは！', english: 'Good afternoon' }
  return { japanese: 'こんばんは！', english: 'Good evening' }
}

export default function Dashboard({ onNavigate, onRefreshDue }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [dueCount, setDueCount] = useState(0)
  const [stats, setStats] = useState<TodayStats>({ reviewed: 0, correct: 0, accuracy: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    try {
      const [p, count, s] = await Promise.all([
        getProfile(),
        getDueCount(),
        getTodayStats()
      ])
      setProfile(p as Profile)
      setDueCount(count as number)
      setStats(s as TodayStats)
    } catch (err) {
      console.error('Failed to load dashboard data', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400 text-lg">読み込み中...</div>
      </div>
    )
  }

  const xpForCurrentLevel = profile ? (profile.level - 1) * 1000 : 0
  const xpForNextLevel = profile ? profile.level * 1000 : 1000
  const xpProgress = profile ? profile.xp - xpForCurrentLevel : 0
  const xpNeeded = xpForNextLevel - xpForCurrentLevel
  const xpPercent = Math.min(100, Math.round((xpProgress / xpNeeded) * 100))

  const greeting = getGreeting()

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto fade-in">
      {/* Header */}
      <div className="mb-5 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
          {greeting.japanese}
          {profile?.display_name && !profile.display_name.includes('@') && (
            <span className="text-slate-300 font-normal text-xl md:text-2xl">, {profile.display_name}</span>
          )}
        </h2>
        <p className="text-slate-400 text-sm md:text-base">{getMotivationalMessage(profile?.streak || 0)}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-5 md:mb-8">
        {/* Streak */}
        <div className="card-surface p-3 md:p-5">
          <div className="flex items-center gap-1.5 md:gap-3 mb-2 md:mb-3">
            <span className="text-lg md:text-2xl">🔥</span>
            <span className="text-slate-400 text-[10px] md:text-sm font-medium uppercase tracking-wide">Streak</span>
          </div>
          <div className="text-2xl md:text-4xl font-bold text-[#E8A838]">{profile?.streak || 0}</div>
          <div className="text-slate-500 text-xs md:text-sm mt-1">days</div>
        </div>

        {/* XP / Level */}
        <div className="card-surface p-3 md:p-5">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <span className="text-slate-400 text-[10px] md:text-sm font-medium uppercase tracking-wide">Level</span>
            <span className="text-[#E8A838] font-bold text-base md:text-lg">{profile?.level || 1}</span>
          </div>
          <div className="text-slate-300 text-[10px] md:text-xs mb-1 md:mb-2 truncate">{getLevelTitle(profile?.level || 1)}</div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 md:h-2 mb-1">
            <div
              className="bg-[#E8A838] h-1.5 md:h-2 rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <div className="text-slate-500 text-[10px] md:text-xs">{xpProgress} / {xpNeeded} XP</div>
        </div>

        {/* Today */}
        <div className="card-surface p-3 md:p-5">
          <div className="flex items-center gap-1.5 md:gap-3 mb-2 md:mb-3">
            <span className="text-lg md:text-2xl">📈</span>
            <span className="text-slate-400 text-[10px] md:text-sm font-medium uppercase tracking-wide">Today</span>
          </div>
          <div className="text-2xl md:text-4xl font-bold text-[#6A994E]">{stats.reviewed}</div>
          <div className="text-slate-500 text-xs md:text-sm mt-1">
            {stats.reviewed > 0 ? `${stats.accuracy}% acc.` : 'reviewed'}
          </div>
        </div>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-5 md:mb-8">
        {/* Review */}
        <div className="card-surface p-4 md:p-6 border-[#4A6FA5] border">
          <div className="flex items-start justify-between mb-3 md:mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Review Cards</h3>
              <p className="text-slate-400 text-sm">SRS flashcard queue</p>
            </div>
            <span className="text-3xl">🃏</span>
          </div>
          <div className="mb-4 md:mb-5">
            <span className="text-3xl md:text-4xl font-bold text-[#4A6FA5]">{Math.min(dueCount, 20)}</span>
            <span className="text-slate-400 ml-2 text-sm">cards today</span>
            {dueCount > 20 && (
              <div className="text-slate-600 text-xs mt-1">{dueCount} total in queue</div>
            )}
          </div>
          <button
            onClick={() => { onNavigate('review'); onRefreshDue() }}
            disabled={dueCount === 0}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-150 active:scale-95 ${
              dueCount > 0
                ? 'bg-[#4A6FA5] hover:bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            {dueCount > 0 ? 'Start Review' : 'All Caught Up!'}
          </button>
        </div>

        {/* Conversation */}
        <div className="card-surface p-4 md:p-6 border-[#6A994E] border">
          <div className="flex items-start justify-between mb-3 md:mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">AI Conversation</h3>
              <p className="text-slate-400 text-sm">Practice with Keita</p>
            </div>
            <span className="text-3xl">💬</span>
          </div>
          <div className="mb-4 md:mb-5">
            <p className="text-slate-300 text-sm leading-relaxed">
              Chat with your AI tutor in Japanese. Build speaking confidence at N5 level.
            </p>
          </div>
          <button
            onClick={() => onNavigate('conversation')}
            className="w-full py-3 px-4 rounded-lg font-semibold bg-[#6A994E] hover:bg-green-500 text-white transition-all duration-150 active:scale-95"
          >
            Start Conversation
          </button>
        </div>
      </div>

      {/* Lessons link */}
      <div className="card-surface p-4 md:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4">
          <span className="text-2xl">📖</span>
          <div>
            <h3 className="text-white font-semibold">Structured Lessons</h3>
            <p className="text-slate-400 text-sm">Grammar points + vocabulary units</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('lessons')}
          className="btn-secondary px-4 md:px-5 shrink-0"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
