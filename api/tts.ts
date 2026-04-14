import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

async function verifyToken(token: string): Promise<boolean> {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await supabase.auth.getUser(token)
  return !!user
}

function buildJapaneseSSML(rawText: string, rate: string): string {
  let text = rawText.replace(/\{([^|{}]+)\|[^|{}]+\}/g, '$1')
  text = text.replace(/\*\*?([^*]+)\*\*?/g, '$1')
  text = text.replace(/__?([^_]+)__?/g, '$1')
  text = text.replace(/`[^`]*`/g, '')
  text = text.replace(/#{1,6}\s?/g, '')

  const isJpChar = (c: string) => /[\u3000-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef0-9]/.test(c)
  const jpOnly = [...text].filter(isJpChar).join('')

  const esc = (s: string) => s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP"><voice name="ja-JP-KeitaNeural"><prosody rate="${rate}">${esc(jpOnly)}</prosody></voice></speak>`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token || !(await verifyToken(token))) return res.status(401).json({ error: 'Unauthorized' })

  const { text, slowMode = true } = req.body as { text: string; slowMode?: boolean }
  const azureKey = process.env.AZURE_SPEECH_KEY
  const azureRegion = process.env.AZURE_SPEECH_REGION

  if (!azureKey || !azureRegion) return res.status(500).json({ error: 'Azure credentials missing' })
  if (!text) return res.status(400).json({ error: 'No text provided' })

  const rate = slowMode ? '-10%' : '0%'
  const ssml = buildJapaneseSSML(text, rate)

  try {
    const azureRes = await fetch(
      `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
        },
        body: ssml
      }
    )
    if (!azureRes.ok) return res.status(502).json({ error: `Azure TTS ${azureRes.status}` })
    const buf = await azureRes.arrayBuffer()
    return res.json({ audio: Buffer.from(buf).toString('base64') })
  } catch (err) {
    return res.status(502).json({ error: (err as Error).message })
  }
}
