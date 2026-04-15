// TTS: Azure REST API (via /api/tts) → MP3 buffer → decoded + played via Web Audio API.
// STT: getUserMedia → PCM → WAV → Azure REST API (via /api/stt).

import { speak as apiSpeak, transcribeAudio as apiTranscribe } from './api'

let audioCtx: AudioContext | null = null
let currentSource: AudioBufferSourceNode | null = null
let requestCounter = 0

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function stopCurrentSource() {
  if (currentSource) {
    currentSource.onended = null
    try { currentSource.stop() } catch { /* already stopped */ }
    currentSource = null
  }
}

export async function initSpeech(): Promise<void> {
  getAudioContext()
}

export function speakJapanese(
  text: string,
  slowMode = true,
  onEnd?: () => void
): () => void {
  if (!text.trim()) return () => {}

  stopCurrentSource()
  const myId = ++requestCounter

  apiSpeak(text, slowMode).then(async (result) => {
    if (myId !== requestCounter) return
    if (result.error) { console.error('TTS error:', result.error); onEnd?.(); return }
    if (!result.audio) { onEnd?.(); return }

    try {
      const binary = atob(result.audio)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

      const ctx = getAudioContext()
      if (ctx.state === 'suspended') await ctx.resume()

      const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0))
      if (myId !== requestCounter) return

      // Apply saved speaker device if supported
      const savedSpeaker = localStorage.getItem('pref_speaker_id')
      if (savedSpeaker && 'setSinkId' in ctx) {
        try { await (ctx as AudioContext & { setSinkId(id: string): Promise<void> }).setSinkId(savedSpeaker) } catch { /* unsupported or invalid */ }
      }

      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)
      currentSource = source

      source.onended = () => {
        if (currentSource === source) currentSource = null
        onEnd?.()
      }

      source.start(0)
    } catch (e) {
      console.error('Audio decode/play error:', e)
      onEnd?.()
    }
  }).catch(e => {
    console.error('TTS fetch error:', e)
    onEnd?.()
  })

  return () => {
    if (myId === requestCounter) requestCounter++
    stopCurrentSource()
  }
}

export function pauseSpeech(): void { audioCtx?.suspend() }
export function resumeSpeech(): void { audioCtx?.resume() }
export function isSpeechPaused(): boolean { return audioCtx?.state === 'suspended' }
export function isSpeechActive(): boolean { return currentSource !== null }
export function stopSpeech(): void { requestCounter++; stopCurrentSource() }

// ── STT ───────────────────────────────────────────────────────────────────────

const STT_SAMPLE_RATE = 16000

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 8192
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)))
  }
  return btoa(binary)
}

function encodeWAV(samples: Int16Array, sampleRate: number): ArrayBuffer {
  const buf = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buf)
  const writeStr = (off: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)) }
  writeStr(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true)
  writeStr(8, 'WAVE'); writeStr(12, 'fmt ')
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true); view.setUint16(34, 16, true)
  writeStr(36, 'data'); view.setUint32(40, samples.length * 2, true)
  let off = 44
  for (let i = 0; i < samples.length; i++, off += 2) view.setInt16(off, samples[i], true)
  return buf
}

export function startListening(
  onResult: (text: string) => void,
  onEnd: () => void,
  _lang = 'ja-JP'
): (cancel?: boolean) => void {
  let audioCtxLocal: AudioContext | null = null
  let processor: ScriptProcessorNode | null = null
  let source: MediaStreamAudioSourceNode | null = null
  let stream: MediaStream | null = null
  const pcmChunks: Float32Array[] = []

  const savedMic = localStorage.getItem('pref_mic_id')
  const audioConstraints: MediaTrackConstraints = { channelCount: 1, echoCancellation: true }
  if (savedMic) audioConstraints.deviceId = { ideal: savedMic }
  navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
    .then((s) => {
      stream = s
      audioCtxLocal = new AudioContext({ sampleRate: STT_SAMPLE_RATE })
      source = audioCtxLocal.createMediaStreamSource(s)
      processor = audioCtxLocal.createScriptProcessor(4096, 1, 1)

      const silent = audioCtxLocal.createGain()
      silent.gain.value = 0
      processor.connect(silent)
      silent.connect(audioCtxLocal.destination)

      processor.onaudioprocess = (e) => {
        pcmChunks.push(new Float32Array(e.inputBuffer.getChannelData(0)))
      }

      source.connect(processor)
    })
    .catch((e) => { console.error('[MIC] getUserMedia error:', e); onEnd() })

  return (cancel = false) => {
    try { processor?.disconnect(); source?.disconnect() } catch { /* ignore */ }
    stream?.getTracks().forEach(t => t.stop())
    audioCtxLocal?.close()

    if (cancel || pcmChunks.length === 0) { onEnd(); return }

    const total = pcmChunks.reduce((n, c) => n + c.length, 0)
    const pcm32 = new Float32Array(total)
    let offset = 0
    for (const c of pcmChunks) { pcm32.set(c, offset); offset += c.length }
    const pcm16 = new Int16Array(pcm32.length)
    for (let i = 0; i < pcm32.length; i++) {
      pcm16[i] = Math.max(-32768, Math.min(32767, pcm32[i] * 32768))
    }

    const audioBase64 = arrayBufferToBase64(encodeWAV(pcm16, STT_SAMPLE_RATE))

    apiTranscribe({ audioBase64, mimeType: 'audio/wav' })
      .then((result) => {
        if (result.text?.trim()) onResult(result.text)
        else { console.error('[MIC] No transcript:', result); onEnd() }
      })
      .catch((e) => { console.error('[MIC] fetch error:', e); onEnd() })
  }
}

export function hasSpeechRecognition(): boolean {
  return !!(navigator.mediaDevices?.getUserMedia)
}
