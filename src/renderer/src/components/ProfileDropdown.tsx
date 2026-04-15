import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { updateProfile } from '../lib/api'
import { useTheme } from '../context/ThemeContext'

const AVATARS = [
  '🐶', '🐱', '🐼', '🐨', '🦊', '🐸',
  '🐧', '🦁', '🐮', '🐷', '🐙', '🦋',
  '🐢', '🦉', '🦝', '🦄', '🐻', '🐹',
  '🐰', '🐯', '🦔', '🐬', '🦈', '🦜'
]

interface Props {
  displayName: string | null
  avatar: string | null
  isAnonymous: boolean
  onClose: () => void
  onUpdate: (name: string, avatar: string) => void
  onSignOut: () => void
}

export default function ProfileDropdown({
  displayName, avatar, isAnonymous, onClose, onUpdate, onSignOut
}: Props) {
  const { theme, toggleTheme } = useTheme()
  const [nameInput, setNameInput] = useState(displayName || '')
  const [selectedAvatar, setSelectedAvatar] = useState(avatar || '🐶')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [savingPassword, setSavingPassword] = useState(false)

  const [mics, setMics] = useState<MediaDeviceInfo[]>([])
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([])
  const [selectedMic, setSelectedMic] = useState(() => localStorage.getItem('pref_mic_id') || '')
  const [selectedSpeaker, setSelectedSpeaker] = useState(() => localStorage.getItem('pref_speaker_id') || '')
  const [devicePermission, setDevicePermission] = useState<'unknown' | 'granted' | 'denied'>('unknown')

  useEffect(() => {
    enumerateDevices()
  }, [])

  async function enumerateDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) return
    const devices = await navigator.mediaDevices.enumerateDevices()
    const hasLabels = devices.some(d => d.label)
    if (hasLabels) {
      setDevicePermission('granted')
      setMics(devices.filter(d => d.kind === 'audioinput'))
      setSpeakers(devices.filter(d => d.kind === 'audiooutput'))
    }
  }

  async function requestMicPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      setDevicePermission('granted')
      await enumerateDevices()
    } catch {
      setDevicePermission('denied')
    }
  }

  function handleMicChange(id: string) {
    setSelectedMic(id)
    localStorage.setItem('pref_mic_id', id)
  }

  function handleSpeakerChange(id: string) {
    setSelectedSpeaker(id)
    localStorage.setItem('pref_speaker_id', id)
  }

  const hasChanges =
    nameInput.trim() !== (displayName || '') ||
    selectedAvatar !== (avatar || '🐶')

  async function handleSaveProfile() {
    setSaving(true)
    setSaveError(null)
    try {
      const { error } = await updateProfile({ display_name: nameInput.trim() || null, avatar: selectedAvatar })
      if (error) {
        setSaveError(`Save failed: ${error.message}`)
      } else {
        onUpdate(nameInput.trim(), selectedAvatar)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Save failed — check Supabase migration')
    }
    setSaving(false)
  }

  async function handleChangePassword() {
    setPasswordMsg(null)
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Password must be at least 6 characters.', ok: false })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Passwords do not match.', ok: false })
      return
    }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)
    if (error) {
      setPasswordMsg({ text: error.message, ok: false })
    } else {
      setPasswordMsg({ text: 'Password updated!', ok: true })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <>
      {/* Backdrop — no click-to-close so unsaved changes aren't lost by accident */}
      <div className="fixed inset-0 z-40 bg-black/50" />

      {/* Sheet — bottom on mobile, top-right dropdown on desktop */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl shadow-2xl overflow-y-auto max-h-[90vh]
                   md:inset-auto md:top-14 md:right-4 md:w-80 md:rounded-2xl md:max-h-[85vh]"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
      >
        {/* Mobile drag handle + close button row */}
        <div className="flex items-center justify-between pt-3 pb-1 px-4">
          <div className="md:hidden w-10 h-1 rounded-full bg-slate-600 mx-auto" />
          <button
            onClick={onClose}
            className="ml-auto flex items-center justify-center w-8 h-8 rounded-full text-lg transition-colors hover:opacity-70"
            style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4 pb-8 md:pb-4">

          {/* Profile header */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-3xl border-2 shrink-0"
              style={{ borderColor: '#4A6FA5', background: 'var(--bg-card)' }}
            >
              {selectedAvatar}
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {nameInput.trim() || 'No display name'}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {isAnonymous ? 'Guest account' : 'Member'}
              </div>
            </div>
          </div>

          {/* Avatar picker */}
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              Choose Avatar
            </div>
            <div className="grid grid-cols-6 gap-1">
              {AVATARS.map(em => (
                <button
                  key={em}
                  onClick={() => setSelectedAvatar(em)}
                  className="text-2xl rounded-lg p-1.5 transition-all active:scale-90"
                  style={{
                    background: selectedAvatar === em ? 'var(--bg-card)' : 'transparent',
                    outline: selectedAvatar === em ? '2px solid #4A6FA5' : 'none',
                    outlineOffset: '1px'
                  }}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Display name */}
          <div className="mb-4">
            <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Display Name
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              maxLength={30}
              placeholder="Enter a display name..."
              className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-1 focus:ring-[#4A6FA5]"
              style={{
                background: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {saveError && (
            <p className="text-xs mb-2 p-2 rounded-lg" style={{ color: '#BC4749', background: '#BC474920' }}>
              {saveError}
            </p>
          )}

          {/* Save profile */}
          <button
            onClick={handleSaveProfile}
            disabled={saving || (!hasChanges && !saved)}
            className="w-full py-2 rounded-lg text-sm font-semibold text-white mb-5 transition-all active:scale-95 disabled:opacity-40"
            style={{ background: saved ? '#6A994E' : '#4A6FA5' }}
          >
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Profile'}
          </button>

          {/* Divider */}
          <div className="h-px mb-4" style={{ background: 'var(--border-color)' }} />

          {/* Theme toggle */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </span>
            <button
              onClick={toggleTheme}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{ background: theme === 'light' ? '#4A6FA5' : '#475569' }}
            >
              <span
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200"
                style={{ left: theme === 'light' ? '28px' : '4px' }}
              />
            </button>
          </div>

          {/* Audio devices */}
          <div className="h-px mb-4" style={{ background: 'var(--border-color)' }} />
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              Audio Devices
            </div>
            {devicePermission !== 'granted' ? (
              <div>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                  Grant microphone access to choose your devices.
                </p>
                {devicePermission === 'denied' ? (
                  <p className="text-xs" style={{ color: '#BC4749' }}>Microphone access was denied. Enable it in your browser settings.</p>
                ) : (
                  <button
                    onClick={requestMicPermission}
                    className="w-full py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                  >
                    Enable Microphone Access
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {mics.length > 0 && (
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Microphone</label>
                    <select
                      value={selectedMic}
                      onChange={e => handleMicChange(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-1 focus:ring-[#4A6FA5]"
                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Default</option>
                      {mics.map(d => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>
                      ))}
                    </select>
                  </div>
                )}
                {speakers.length > 0 && (
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Speaker</label>
                    <select
                      value={selectedSpeaker}
                      onChange={e => handleSpeakerChange(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-1 focus:ring-[#4A6FA5]"
                      style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Default</option>
                      {speakers.map(d => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>
                      ))}
                    </select>
                  </div>
                )}
                {mics.length === 0 && speakers.length === 0 && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No audio devices found.</p>
                )}
              </div>
            )}
          </div>

          {/* Change password (non-anonymous only) */}
          {!isAnonymous && (
            <>
              <div className="h-px mb-4" style={{ background: 'var(--border-color)' }} />
              <div className="mb-4">
                <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                  Change Password
                </div>
                <div className="space-y-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 chars)"
                    className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-1 focus:ring-[#4A6FA5]"
                    style={{
                      background: 'var(--bg-input)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-1 focus:ring-[#4A6FA5]"
                    style={{
                      background: 'var(--bg-input)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  {passwordMsg && (
                    <p className="text-xs" style={{ color: passwordMsg.ok ? '#6A994E' : '#BC4749' }}>
                      {passwordMsg.text}
                    </p>
                  )}
                  <button
                    onClick={handleChangePassword}
                    disabled={savingPassword || !newPassword}
                    className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-40"
                    style={{ background: '#4A6FA5' }}
                  >
                    {savingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="h-px mb-4" style={{ background: 'var(--border-color)' }} />

          {/* Sign out */}
          <button
            onClick={onSignOut}
            className="w-full py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
            style={{ color: '#BC4749', background: 'var(--bg-card)' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}
