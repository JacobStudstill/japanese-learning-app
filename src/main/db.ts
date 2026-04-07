import { app } from 'electron'
import path from 'path'
import fs from 'fs'

// Use sql.js (pure WASM, no native compilation needed)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const initSqlJs = require('sql.js')

// Lazy getter for dbPath — app.getPath() only works after app is ready
function getDbPath(): string {
  return path.join(app.getPath('userData'), 'japanese-learning.db')
}

let db: SqlDatabase | null = null

interface SqlDatabase {
  run: (sql: string, params?: unknown[]) => void
  exec: (sql: string) => Array<{ columns: string[]; values: unknown[][] }>
  prepare: (sql: string) => SqlStatement
  export: () => Uint8Array
  close: () => void
}

interface SqlStatement {
  run: (params?: unknown) => void
  get: (params?: unknown) => Record<string, unknown> | undefined
  all: (params?: unknown) => Record<string, unknown>[]
  free: () => void
}

type RowRecord = Record<string, unknown>

function resultToObjects(result: Array<{ columns: string[]; values: unknown[][] }>): RowRecord[] {
  if (!result || result.length === 0) return []
  const { columns, values } = result[0]
  return values.map(row => {
    const obj: RowRecord = {}
    columns.forEach((col, i) => { obj[col] = row[i] })
    return obj
  })
}

async function getDb(): Promise<SqlDatabase> {
  if (db) return db

  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      // In production, use the file from node_modules
      return path.join(__dirname, '../../node_modules/sql.js/dist/', file)
    }
  })

  const dbFilePath = getDbPath()

  // Load existing database or create new one
  if (fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath)
    db = new SQL.Database(fileBuffer) as SqlDatabase
  } else {
    db = new SQL.Database() as SqlDatabase
  }

  initSchema()
  return db
}

function saveDb(): void {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(getDbPath(), buffer)
}

function initSchema(): void {
  if (!db) return

  db.run(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY,
      streak INTEGER DEFAULT 0,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      last_study_date TEXT,
      daily_new_cards INTEGER DEFAULT 15,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS vocab_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      reading TEXT NOT NULL,
      meaning TEXT NOT NULL,
      example_sentence TEXT,
      example_reading TEXT,
      example_meaning TEXT,
      jlpt_level TEXT DEFAULT 'N5',
      part_of_speech TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS srs_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vocab_id INTEGER REFERENCES vocab_items(id),
      card_type TEXT NOT NULL,
      interval INTEGER DEFAULT 1,
      ease_factor REAL DEFAULT 2.5,
      repetitions INTEGER DEFAULT 0,
      due_date TEXT DEFAULT (date('now')),
      last_reviewed TEXT,
      status TEXT DEFAULT 'new'
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS lesson_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id INTEGER,
      lesson_id INTEGER,
      completed INTEGER DEFAULT 0,
      completed_at TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS quiz_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER REFERENCES srs_cards(id),
      rating INTEGER,
      reviewed_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // Ensure default profile
  const result = db.exec('SELECT id FROM user_profile WHERE id = 1')
  if (result.length === 0 || result[0].values.length === 0) {
    db.run('INSERT INTO user_profile (id, streak, xp, level, daily_new_cards) VALUES (1, 0, 0, 1, 15)')
    saveDb()
  }
}

// ── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(): Promise<RowRecord | null> {
  const d = await getDb()
  const result = d.exec('SELECT * FROM user_profile WHERE id = 1')
  const rows = resultToObjects(result)
  return rows[0] || null
}

export async function updateProfile(data: RowRecord): Promise<RowRecord | null> {
  const d = await getDb()
  const keys = Object.keys(data)
  const setClause = keys.map(k => `${k} = ?`).join(', ')
  const values = keys.map(k => data[k])
  d.run(`UPDATE user_profile SET ${setClause} WHERE id = 1`, values)
  saveDb()
  return getProfile()
}

// ── Vocab ─────────────────────────────────────────────────────────────────────

export async function getAllVocab(): Promise<RowRecord[]> {
  const d = await getDb()
  const result = d.exec('SELECT * FROM vocab_items ORDER BY id')
  return resultToObjects(result)
}

export async function upsertVocab(items: Array<{
  word: string
  reading: string
  meaning: string
  exampleSentence?: string
  exampleReading?: string
  exampleMeaning?: string
  partOfSpeech: string
}>): Promise<void> {
  const d = await getDb()
  for (const item of items) {
    d.run(
      `INSERT OR IGNORE INTO vocab_items (word, reading, meaning, example_sentence, example_reading, example_meaning, jlpt_level, part_of_speech)
       VALUES (?, ?, ?, ?, ?, ?, 'N5', ?)`,
      [item.word, item.reading, item.meaning, item.exampleSentence || null, item.exampleReading || null, item.exampleMeaning || null, item.partOfSpeech]
    )
  }
  saveDb()
}

// ── SRS Cards ─────────────────────────────────────────────────────────────────

export async function getDueCards(): Promise<RowRecord[]> {
  const d = await getDb()
  const today = new Date().toISOString().slice(0, 10)
  const result = d.exec(`
    SELECT sc.id, sc.vocab_id, sc.card_type, sc.interval, sc.ease_factor, sc.repetitions,
           sc.due_date, sc.last_reviewed, sc.status,
           vi.word, vi.reading, vi.meaning, vi.example_sentence, vi.example_reading, vi.example_meaning, vi.part_of_speech
    FROM srs_cards sc
    JOIN vocab_items vi ON sc.vocab_id = vi.id
    WHERE sc.due_date <= '${today}'
    ORDER BY sc.due_date ASC
    LIMIT 20
  `)
  return resultToObjects(result)
}

export async function getNewCards(limit: number = 15): Promise<RowRecord[]> {
  const d = await getDb()
  const result = d.exec(`
    SELECT sc.id, sc.vocab_id, sc.card_type, sc.interval, sc.ease_factor, sc.repetitions,
           sc.due_date, sc.last_reviewed, sc.status,
           vi.word, vi.reading, vi.meaning, vi.example_sentence, vi.example_reading, vi.example_meaning, vi.part_of_speech
    FROM srs_cards sc
    JOIN vocab_items vi ON sc.vocab_id = vi.id
    WHERE sc.status = 'new'
    LIMIT ${limit}
  `)
  return resultToObjects(result)
}

export async function getAllCards(): Promise<RowRecord[]> {
  const d = await getDb()
  const result = d.exec(`
    SELECT sc.id, sc.vocab_id, sc.card_type, sc.interval, sc.repetitions, sc.status
    FROM srs_cards sc
  `)
  return resultToObjects(result)
}

export async function getDueCardCount(): Promise<number> {
  const d = await getDb()
  const today = new Date().toISOString().slice(0, 10)
  const result = d.exec(`SELECT COUNT(*) as count FROM srs_cards WHERE due_date <= '${today}'`)
  const rows = resultToObjects(result)
  return (rows[0]?.count as number) || 0
}

export async function updateCard(id: number, data: {
  interval: number
  ease_factor: number
  repetitions: number
  due_date: string
  last_reviewed: string
  status: string
}): Promise<void> {
  const d = await getDb()
  d.run(
    `UPDATE srs_cards SET interval=?, ease_factor=?, repetitions=?, due_date=?, last_reviewed=?, status=? WHERE id=?`,
    [data.interval, data.ease_factor, data.repetitions, data.due_date, data.last_reviewed, data.status, id]
  )
  saveDb()
}

export async function recordQuiz(cardId: number, rating: number): Promise<void> {
  const d = await getDb()
  const now = new Date().toISOString()
  d.run('INSERT INTO quiz_history (card_id, rating, reviewed_at) VALUES (?, ?, ?)', [cardId, rating, now])
  saveDb()
}

export async function getTodayStats(): Promise<{ reviewed: number; correct: number; accuracy: number }> {
  const d = await getDb()
  const today = new Date().toISOString().slice(0, 10)
  const result = d.exec(`
    SELECT COUNT(*) as reviewed,
           SUM(CASE WHEN rating >= 3 THEN 1 ELSE 0 END) as correct
    FROM quiz_history
    WHERE date(reviewed_at) = '${today}'
  `)
  const rows = resultToObjects(result)
  const reviewed = (rows[0]?.reviewed as number) || 0
  const correct = (rows[0]?.correct as number) || 0
  return {
    reviewed,
    correct,
    accuracy: reviewed > 0 ? Math.round((correct / reviewed) * 100) : 0
  }
}

// ── Lesson Progress ───────────────────────────────────────────────────────────

export async function getLessonProgress(): Promise<RowRecord[]> {
  const d = await getDb()
  const result = d.exec('SELECT * FROM lesson_progress')
  return resultToObjects(result)
}

export async function markLessonComplete(unitId: number, lessonId: number): Promise<void> {
  const d = await getDb()
  const existing = d.exec(`SELECT id FROM lesson_progress WHERE unit_id = ${unitId} AND lesson_id = ${lessonId}`)
  if (existing.length > 0 && existing[0].values.length > 0) {
    const now = new Date().toISOString()
    d.run(`UPDATE lesson_progress SET completed = 1, completed_at = '${now}' WHERE unit_id = ${unitId} AND lesson_id = ${lessonId}`)
  } else {
    const now = new Date().toISOString()
    d.run(`INSERT INTO lesson_progress (unit_id, lesson_id, completed, completed_at) VALUES (${unitId}, ${lessonId}, 1, '${now}')`)
  }
  saveDb()
}

// ── Seed ─────────────────────────────────────────────────────────────────────

export async function seedVocabIfEmpty(vocab: Array<{
  word: string
  reading: string
  meaning: string
  exampleSentence?: string
  exampleReading?: string
  exampleMeaning?: string
  partOfSpeech: string
}>): Promise<void> {
  const d = await getDb()
  const result = d.exec('SELECT COUNT(*) as c FROM vocab_items')
  const rows = resultToObjects(result)
  const count = (rows[0]?.c as number) || 0
  if (count > 0) return

  await upsertVocab(vocab)

  // Create SRS cards (meaning + reading types for each word)
  const vocabResult = d.exec('SELECT id FROM vocab_items')
  const vocabRows = resultToObjects(vocabResult)

  for (const item of vocabRows) {
    const now = new Date().toISOString().slice(0, 10)
    d.run(
      `INSERT INTO srs_cards (vocab_id, card_type, status, due_date) VALUES (?, 'meaning', 'new', ?)`,
      [item.id, now]
    )
    d.run(
      `INSERT INTO srs_cards (vocab_id, card_type, status, due_date) VALUES (?, 'reading', 'new', ?)`,
      [item.id, now]
    )
  }
  saveDb()
}
