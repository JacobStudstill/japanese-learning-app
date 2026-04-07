import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Review from './pages/Review'
import Lessons from './pages/Lessons'
import Conversation from './pages/Conversation'
import Progress from './pages/Progress'
import Login from './components/Login'
import { initSpeech } from './lib/speech'
import { getDueCount } from './lib/api'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'

type Page = 'dashboard' | 'lessons' | 'review' | 'conversation' | 'progress'

const NAV_ITEMS: Array<{ id: Page; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
  { id: 'lessons', label: 'Lessons', icon: '📖' },
  { id: 'review', label: 'Review', icon: '🃏' },
  { id: 'conversation', label: 'Conversation', icon: '💬' },
  { id: 'progress', label: 'Progress', icon: '📊' }
]

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [page, setPage] = useState<Page>('dashboard')
  const [dueCount, setDueCount] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    initSpeech().catch(() => {})
    loadDueCount()
  }, [session])

  async function loadDueCount() {
    try { setDueCount(await getDueCount()) } catch { /* ignore */ }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  // Still checking auth
  if (session === undefined) {
    return <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
      <div className="text-slate-400">Loading...</div>
    </div>
  }

  if (!session) return <Login />

  return (
    <div className="flex h-screen bg-[#0f0f1a] text-slate-200 overflow-hidden">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-56 bg-[#12121f] border-r border-slate-800 flex-col py-6 px-3 shrink-0">
        <div className="px-3 mb-8">
          <h1 className="text-xl font-bold text-white">
            <span className="text-[#E8A838]">日</span>
            <span className="text-slate-300 text-sm ml-2 font-normal">NihongoLearn</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">JLPT N5</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setPage(item.id); if (item.id === 'dashboard') loadDueCount() }}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 relative
                ${page === item.id
                  ? 'bg-[#1a1a2e] text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1a2e]'
                }
              `}
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

        <div className="px-3 pt-4 border-t border-slate-800">
          <button onClick={handleSignOut} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {page === 'dashboard' && <Dashboard onNavigate={setPage} onRefreshDue={loadDueCount} />}
        {page === 'lessons' && <Lessons />}
        {page === 'review' && <Review onComplete={loadDueCount} />}
        {page === 'conversation' && <Conversation />}
        {page === 'progress' && <Progress />}
      </main>

      {/* Bottom nav — mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#12121f] border-t border-slate-800 flex items-center justify-around px-1 py-1 z-50 safe-area-bottom">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => { setPage(item.id); if (item.id === 'dashboard') loadDueCount() }}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg relative transition-colors ${
              page === item.id ? 'text-white' : 'text-slate-500'
            }`}
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
  )
}
