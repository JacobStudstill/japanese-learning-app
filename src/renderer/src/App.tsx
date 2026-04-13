import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Review from './pages/Review'
import Lessons from './pages/Lessons'
import Conversation from './pages/Conversation'
import Progress from './pages/Progress'
import Login from './components/Login'
import ProfileDropdown from './components/ProfileDropdown'
import { ThemeProvider } from './context/ThemeContext'
import { initSpeech } from './lib/speech'
import { getDueCount, getProfile } from './lib/api'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'

type Page = 'dashboard' | 'lessons' | 'review' | 'conversation' | 'progress'

const NAV_ITEMS: Array<{ id: Page; label: string; icon: string }> = [
  { id: 'dashboard',    label: 'Dashboard',    icon: '⌂' },
  { id: 'lessons',      label: 'Lessons',      icon: '📖' },
  { id: 'review',       label: 'Review',       icon: '🃏' },
  { id: 'conversation', label: 'Conversation', icon: '💬' },
  { id: 'progress',     label: 'Progress',     icon: '📊' }
]

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [page, setPage] = useState<Page>('dashboard')
  const [dueCount, setDueCount] = useState(0)
  const [showProfile, setShowProfile] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [avatar, setAvatar] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    initSpeech().catch(() => {})
    loadDueCount()
    loadProfileData()
  }, [session])

  async function loadDueCount() {
    try { setDueCount(await getDueCount()) } catch { /* ignore */ }
  }

  async function loadProfileData() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = await getProfile() as any
      setDisplayName(p?.display_name ?? null)
      setAvatar(p?.avatar ?? null)
    } catch { /* ignore */ }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setShowProfile(false)
  }

  function handleProfileUpdate(name: string, av: string) {
    setDisplayName(name || null)
    setAvatar(av)
  }

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    )
  }

  if (!session) return <Login />

  const isAnonymous = session.user?.is_anonymous === true
  const currentAvatar = avatar || '🐶'

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>

        {/* ── Sidebar — desktop only ───────────────────────────────────── */}
        <aside
          className="hidden md:flex w-56 flex-col py-6 px-3 shrink-0 border-r"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        >
          <div className="px-3 mb-8">
            <h1 className="text-xl font-bold">
              <span style={{ color: '#E8A838' }}>日</span>
              <span className="text-sm ml-2 font-normal" style={{ color: 'var(--text-secondary)' }}>NihongoLearn</span>
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>JLPT N5</p>
          </div>

          <nav className="flex flex-col gap-1 flex-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); if (item.id === 'dashboard') loadDueCount() }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 relative"
                style={{
                  background: page === item.id ? 'var(--bg-card)' : 'transparent',
                  color: page === item.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: page === item.id ? '1px solid var(--border-subtle)' : '1px solid transparent'
                }}
              >
                <span className="text-base">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
                {item.id === 'review' && dueCount > 0 && (
                  <span className="ml-auto bg-[#BC4749] text-white text-xs font-bold px-1.5 py-0.5 rounded-full pulse-soft">
                    {dueCount > 99 ? '99+' : dueCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0">

          {/* Top bar */}
          <header
            className="h-12 flex items-center justify-between px-4 shrink-0 border-b"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          >
            {/* App title — shown on mobile (sidebar is hidden) */}
            <div className="md:hidden flex items-center gap-2">
              <span style={{ color: '#E8A838' }} className="font-bold">日</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>NihongoLearn</span>
            </div>
            <div className="hidden md:block" />

            {/* Profile button */}
            <button
              onClick={() => setShowProfile(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-xl border transition-all hover:opacity-80 active:scale-95"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
              aria-label="Profile"
            >
              {currentAvatar}
            </button>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
            {page === 'dashboard'    && <Dashboard onNavigate={setPage} onRefreshDue={loadDueCount} />}
            {page === 'lessons'      && <Lessons />}
            {page === 'review'       && <Review onComplete={loadDueCount} />}
            {page === 'conversation' && <Conversation />}
            {page === 'progress'     && <Progress />}
          </main>

          {/* Bottom nav — mobile only */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around px-1 py-1 z-50 border-t safe-area-bottom"
               style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); if (item.id === 'dashboard') loadDueCount() }}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg relative transition-colors"
                style={{ color: page === item.id ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.id === 'review' && dueCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[#BC4749] text-white text-[9px] font-bold min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full">
                    {dueCount > 99 ? '99+' : dueCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Profile dropdown */}
        {showProfile && (
          <ProfileDropdown
            displayName={displayName}
            avatar={avatar}
            isAnonymous={isAnonymous}
            onClose={() => setShowProfile(false)}
            onUpdate={handleProfileUpdate}
            onSignOut={handleSignOut}
          />
        )}
      </div>
    </ThemeProvider>
  )
}
