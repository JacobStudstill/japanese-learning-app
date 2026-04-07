import { supabase } from './supabase'

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('user_profile')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error?.code === 'PGRST116') {
    // First login — create profile and seed cards
    const { data: newProfile } = await supabase
      .from('user_profile')
      .insert({ user_id: user.id })
      .select()
      .single()
    await supabase.rpc('create_user_cards', { p_user_id: user.id })
    return newProfile
  }

  return data
}

export async function updateProfile(data: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: updated } = await supabase
    .from('user_profile')
    .update(data)
    .eq('user_id', user.id)
    .select()
    .single()
  return updated
}

// ── Vocab ─────────────────────────────────────────────────────────────────────

export async function getVocab() {
  const { data } = await supabase.from('vocab_items').select('*').order('id')
  return data || []
}

export async function getAllCards() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('srs_cards')
    .select('id, vocab_id, card_type, interval, repetitions, status')
    .eq('user_id', user.id)
  return data || []
}

export async function getDueCards() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('srs_cards')
    .select(`id, vocab_id, card_type, interval, ease_factor, repetitions, due_date, last_reviewed, status,
             vocab_items(word, reading, meaning, example_sentence, example_reading, example_meaning, part_of_speech)`)
    .eq('user_id', user.id)
    .lte('due_date', today)
    .order('due_date')
    .limit(20)
  return (data || []).map(flattenCard)
}

export async function getNewCards(limit = 5) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('srs_cards')
    .select(`id, vocab_id, card_type, interval, ease_factor, repetitions, due_date, last_reviewed, status,
             vocab_items(word, reading, meaning, example_sentence, example_reading, example_meaning, part_of_speech)`)
    .eq('user_id', user.id)
    .eq('status', 'new')
    .limit(limit)
  return (data || []).map(flattenCard)
}

export async function getDueCount() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0
  const today = new Date().toISOString().slice(0, 10)
  const { count } = await supabase
    .from('srs_cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('due_date', today)
  return count || 0
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenCard(row: any) {
  const vocab = row.vocab_items || {}
  return {
    id: row.id,
    vocab_id: row.vocab_id,
    card_type: row.card_type,
    interval: row.interval,
    ease_factor: row.ease_factor,
    repetitions: row.repetitions,
    due_date: row.due_date,
    last_reviewed: row.last_reviewed,
    status: row.status,
    word: vocab.word,
    reading: vocab.reading,
    meaning: vocab.meaning,
    example_sentence: vocab.example_sentence,
    example_reading: vocab.example_reading,
    example_meaning: vocab.example_meaning,
    part_of_speech: vocab.part_of_speech
  }
}

export async function reviewCard(data: {
  id: number
  rating: number
  interval: number
  easeFactor: number
  repetitions: number
  dueDate: string
  status: string
}) {
  const now = new Date().toISOString()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('srs_cards')
    .update({
      interval: data.interval,
      ease_factor: data.easeFactor,
      repetitions: data.repetitions,
      due_date: data.dueDate,
      last_reviewed: now,
      status: data.status
    })
    .eq('id', data.id)
    .eq('user_id', user.id)

  await supabase
    .from('quiz_history')
    .insert({ user_id: user.id, card_id: data.id, rating: data.rating })

  // XP + streak update
  const profile = await getProfile()
  if (!profile) return
  const today = new Date().toISOString().slice(0, 10)
  const lastStudy = profile.last_study_date
  const newXp = (profile.xp || 0) + (data.rating >= 3 ? 10 : 2)
  const newLevel = Math.floor(newXp / 1000) + 1
  let newStreak = profile.streak || 0

  if (lastStudy !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    newStreak = lastStudy === yesterday ? newStreak + 1 : 1
  }

  await updateProfile({
    xp: newXp,
    level: newLevel,
    streak: newStreak,
    last_study_date: today
  })
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getTodayStats() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { reviewed: 0, correct: 0, accuracy: 0 }
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('quiz_history')
    .select('rating')
    .eq('user_id', user.id)
    .gte('reviewed_at', today)
  const reviewed = data?.length || 0
  const correct = data?.filter(r => r.rating >= 3).length || 0
  return {
    reviewed,
    correct,
    accuracy: reviewed > 0 ? Math.round((correct / reviewed) * 100) : 0
  }
}

// ── Lessons ───────────────────────────────────────────────────────────────────

export async function getLessonProgress() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', user.id)
  return data || []
}

export async function markLessonComplete(unitId: number, lessonId: number) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('lesson_progress')
    .upsert(
      { user_id: user.id, unit_id: unitId, lesson_id: lessonId, completed: 1, completed_at: new Date().toISOString() },
      { onConflict: 'user_id,unit_id,lesson_id' }
    )

  await updateProfile({ xp: ((await getProfile())?.xp || 0) + 50 })
}

// ── AI & Speech ───────────────────────────────────────────────────────────────

export async function sendMessage(messages: Array<{ role: string; content: string }>) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  })
  return res.json()
}

export async function speak(text: string, slowMode = true) {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, slowMode })
  })
  return res.json()
}

export async function transcribeAudio(data: { audioBase64: string; mimeType: string }) {
  const res = await fetch('/api/stt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioBase64: data.audioBase64 })
  })
  return res.json()
}
