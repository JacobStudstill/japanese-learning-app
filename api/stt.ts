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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token || !(await verifyToken(token))) return res.status(401).json({ error: 'Unauthorized' })

  const { audioBase64 } = req.body as { audioBase64: string }
  const azureKey = process.env.AZURE_SPEECH_KEY
  const azureRegion = process.env.AZURE_SPEECH_REGION

  if (!azureKey || !azureRegion) return res.status(500).json({ error: 'Azure credentials missing' })
  if (!audioBase64) return res.status(400).json({ error: 'No audio provided' })

  try {
    const audioBuffer = Buffer.from(audioBase64, 'base64')
    const azureRes = await fetch(
      `https://${azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=ja-JP&format=simple`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureKey,
          'Content-Type': 'audio/wav',
          'Accept': 'application/json'
        },
        body: audioBuffer
      }
    )
    if (!azureRes.ok) return res.status(502).json({ error: `Azure STT ${azureRes.status}` })
    const json = await azureRes.json() as { RecognitionStatus: string; DisplayText?: string }
    if (json.RecognitionStatus === 'Success') return res.json({ text: json.DisplayText || '' })
    return res.json({ text: '' })
  } catch (err) {
    return res.status(502).json({ error: (err as Error).message })
  }
}
