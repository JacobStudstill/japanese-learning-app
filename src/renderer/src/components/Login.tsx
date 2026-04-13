import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email for a confirmation link, then come back and log in.')
    }

    setLoading(false)
  }

  async function handleGuestLogin() {
    setGuestLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInAnonymously()
    if (error) {
      setError(
        error.message.includes('Anonymous') || error.message.includes('anonymous')
          ? 'Guest access is not enabled yet. Go to Supabase → Authentication → Configuration and enable "Allow anonymous sign-ins".'
          : error.message
      )
    }
    setGuestLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎌</div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Japanese Learning</h1>
          <p style={{ color: 'var(--text-secondary)' }}>JLPT N5 · SRS · AI Conversation</p>
        </div>

        <div className="rounded-xl border p-6 mb-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          {/* Login / Sign Up tabs */}
          <div className="flex mb-6 rounded-lg p-1" style={{ background: 'var(--bg-input)' }}>
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setMessage(null) }}
                className="flex-1 py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  background: mode === m ? '#4A6FA5' : 'transparent',
                  color: mode === m ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                {m === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full rounded-lg px-4 py-2.5 border focus:outline-none focus:ring-1 focus:ring-[#4A6FA5]"
                style={{
                  background: 'var(--bg-input)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg px-4 py-2.5 border focus:outline-none focus:ring-1 focus:ring-[#4A6FA5]"
                style={{
                  background: 'var(--bg-input)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm" style={{ color: '#BC4749' }}>{error}</p>}
            {message && <p className="text-sm" style={{ color: '#6A994E' }}>{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 bg-[#4A6FA5] hover:bg-blue-500"
            >
              {loading ? '...' : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Guest access */}
        <div className="relative flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
        </div>

        <button
          onClick={handleGuestLogin}
          disabled={guestLoading}
          className="w-full py-3 rounded-xl border font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)'
          }}
        >
          {guestLoading ? '...' : '👤 Continue as Guest'}
        </button>
        <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          No account needed · Progress saved to this device
        </p>
      </div>
    </div>
  )
}
