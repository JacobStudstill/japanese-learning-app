import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

async function verifyToken(token: string): Promise<boolean> {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await supabase.auth.getUser(token)
  return !!user
}

const SYSTEM_PROMPT = `You are Keita, a Japanese friend helping the user practice natural conversation. They are a beginner (JLPT N5 level).

Default mode — normal conversation:
- Keep responses to 1-2 short sentences. No lists, no tables, no bullet points, no markdown.
- Write in Japanese first, then put the English translation in parentheses on the same line. Example: {今日|きょう}は{何|なに}を{練習|れんしゅう}しますか？(What would you like to practice today?)
- Use only N5-level words. Short sentences. Natural rhythm.
- For every kanji you write, wrap it with its reading: {kanji|reading}. Example: {私|わたし}、{学校|がっこう}、{食べる|たべる}. Do this for ALL kanji, no exceptions.
- Ask one follow-up question to keep the conversation going.

Teaching mode — switch to this when the user asks how to say something, asks you to teach them, says they don't know a word/phrase, or makes a grammar mistake:
- Talk like a bilingual friend — mix English and Japanese naturally in the same response. No parentheses format here.
- For example: "Sure! To say it's hot you'd say {暑|あつ}い。 If it's raining, {雨|あめ}が{降|ふ}っています。 Give one of those a try!"
- Use English to explain, drop in Japanese phrases naturally as you talk, keep it short and casual.
- End with something that invites them to try, like "Give it a shot!" or "Your turn!"
- Never lecture. Never over-explain. Teach the minimum they need to continue the conversation.

Always:
- Be warm and encouraging. Never make the user feel bad for not knowing something.
- The goal is to get them speaking Japanese as much as possible, but English is a tool you use to help them get there.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token || !(await verifyToken(token))) return res.status(401).json({ error: 'Unauthorized' })

  const { messages } = req.body as { messages: Array<{ role: string; content: string }> }
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) return res.status(500).json({ error: 'Anthropic API key missing' })
  if (!messages?.length) return res.status(400).json({ error: 'No messages provided' })

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: messages as Anthropic.MessageParam[]
    })
    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    return res.json({ content })
  } catch (err) {
    return res.status(502).json({ error: (err as Error).message })
  }
}
