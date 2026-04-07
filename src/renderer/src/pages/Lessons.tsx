import { useState, useEffect } from 'react'
import { getLessonProgress, markLessonComplete } from '../lib/api'

interface LessonProgressRecord {
  id: number
  unit_id: number
  lesson_id: number
  completed: number
  completed_at: string | null
}

interface Lesson {
  id: number
  title: string
  grammar: string
  grammarExample: string
  grammarReading?: string
  grammarTranslation: string
  vocab: Array<{ word: string; reading: string; meaning: string }>
  tip?: string
}

interface Unit {
  id: number
  title: string
  subtitle: string
  color: string
  bgColor: string
  lessons: Lesson[]
}

const CURRICULUM: Unit[] = [
  {
    id: 1,
    title: 'Unit 1: Foundations',
    subtitle: 'The basics of Japanese',
    color: '#6A994E',
    bgColor: '#6A994E20',
    lessons: [
      {
        id: 1,
        title: 'Hiragana Basics',
        grammar: 'は (wa) — Topic marker particle',
        grammarExample: '私は学生です。',
        grammarReading: 'わたしはがくせいです。',
        grammarTranslation: 'I am a student.',
        vocab: [
          { word: '私', reading: 'わたし', meaning: 'I, me' },
          { word: 'あなた', reading: 'あなた', meaning: 'you' },
          { word: '学生', reading: 'がくせい', meaning: 'student' },
          { word: '先生', reading: 'せんせい', meaning: 'teacher' }
        ],
        tip: 'The particle は (written as ha, read as wa) marks the topic of the sentence.'
      },
      {
        id: 2,
        title: 'です · Polite Copula',
        grammar: '～です — Polite "to be"',
        grammarExample: 'これはペンです。',
        grammarReading: 'これはぺんです。',
        grammarTranslation: 'This is a pen.',
        vocab: [
          { word: 'これ', reading: 'これ', meaning: 'this (near me)' },
          { word: 'それ', reading: 'それ', meaning: 'that (near you)' },
          { word: 'あれ', reading: 'あれ', meaning: 'that over there' },
          { word: '本', reading: 'ほん', meaning: 'book' }
        ],
        tip: 'です makes statements polite. ではありません is the polite negative.'
      },
      {
        id: 3,
        title: 'Numbers 1–10',
        grammar: 'Counter: ～枚 for flat objects',
        grammarExample: '紙が三枚あります。',
        grammarReading: 'かみがさんまいあります。',
        grammarTranslation: 'There are three sheets of paper.',
        vocab: [
          { word: '一', reading: 'いち', meaning: 'one' },
          { word: '二', reading: 'に', meaning: 'two' },
          { word: '三', reading: 'さん', meaning: 'three' },
          { word: '四', reading: 'し / よん', meaning: 'four' },
          { word: '五', reading: 'ご', meaning: 'five' }
        ],
        tip: 'Japanese has many counters. いち、に、さん is used for general counting.'
      }
    ]
  },
  {
    id: 2,
    title: 'Unit 2: Core Grammar',
    subtitle: 'Verbs and basic sentences',
    color: '#4A6FA5',
    bgColor: '#4A6FA520',
    lessons: [
      {
        id: 4,
        title: 'る-Verbs (Group 2)',
        grammar: '～ます — Polite verb ending',
        grammarExample: '毎日ご飯を食べます。',
        grammarReading: 'まいにちごはんをたべます。',
        grammarTranslation: 'I eat rice every day.',
        vocab: [
          { word: '食べる', reading: 'たべる', meaning: 'to eat' },
          { word: '見る', reading: 'みる', meaning: 'to see/watch' },
          { word: '起きる', reading: 'おきる', meaning: 'to wake up' },
          { word: '寝る', reading: 'ねる', meaning: 'to sleep' }
        ],
        tip: 'る-verbs (ichidan) simply drop る and add ます for polite form.'
      },
      {
        id: 5,
        title: 'う-Verbs (Group 1)',
        grammar: 'Consonant-stem verb conjugation',
        grammarExample: '本を読みます。',
        grammarReading: 'ほんをよみます。',
        grammarTranslation: 'I read books.',
        vocab: [
          { word: '読む', reading: 'よむ', meaning: 'to read' },
          { word: '書く', reading: 'かく', meaning: 'to write' },
          { word: '聞く', reading: 'きく', meaning: 'to listen' },
          { word: '行く', reading: 'いく', meaning: 'to go' }
        ],
        tip: 'う-verbs change their final sound before ます: む→み、く→き、ぐ→ぎ etc.'
      },
      {
        id: 6,
        title: 'Particles: を, に, で',
        grammar: 'Object and location particles',
        grammarExample: '駅で電車を待ちます。',
        grammarReading: 'えきででんしゃをまちます。',
        grammarTranslation: 'I wait for the train at the station.',
        vocab: [
          { word: '駅', reading: 'えき', meaning: 'station' },
          { word: '電車', reading: 'でんしゃ', meaning: 'train' },
          { word: '待つ', reading: 'まつ', meaning: 'to wait' },
          { word: '公園', reading: 'こうえん', meaning: 'park' }
        ],
        tip: 'を marks the direct object. に marks direction/destination. で marks where an action happens.'
      }
    ]
  },
  {
    id: 3,
    title: 'Unit 3: Adjectives',
    subtitle: 'Describing the world around you',
    color: '#BC4749',
    bgColor: '#BC474920',
    lessons: [
      {
        id: 7,
        title: 'い-Adjectives',
        grammar: 'い-adjective conjugation',
        grammarExample: 'この映画は面白いです。',
        grammarReading: 'このえいがはおもしろいです。',
        grammarTranslation: 'This movie is interesting.',
        vocab: [
          { word: '大きい', reading: 'おおきい', meaning: 'big' },
          { word: '小さい', reading: 'ちいさい', meaning: 'small' },
          { word: '新しい', reading: 'あたらしい', meaning: 'new' },
          { word: '古い', reading: 'ふるい', meaning: 'old' }
        ],
        tip: 'い-adjectives: add くない for negative, かった for past, くなかった for past negative.'
      },
      {
        id: 8,
        title: 'な-Adjectives',
        grammar: 'な-adjective + noun modification',
        grammarExample: '静かな図書館が好きです。',
        grammarReading: 'しずかなとしょかんがすきです。',
        grammarTranslation: 'I like quiet libraries.',
        vocab: [
          { word: '好き', reading: 'すき', meaning: 'liked' },
          { word: '嫌い', reading: 'きらい', meaning: 'disliked' },
          { word: '静か', reading: 'しずか', meaning: 'quiet' },
          { word: '有名', reading: 'ゆうめい', meaning: 'famous' }
        ],
        tip: 'な-adjectives need な when directly before a noun, just です at end of sentence.'
      }
    ]
  },
  {
    id: 4,
    title: 'Unit 4: Useful Expressions',
    subtitle: 'Everyday Japanese phrases',
    color: '#E8A838',
    bgColor: '#E8A83820',
    lessons: [
      {
        id: 9,
        title: 'Requests: ～てください',
        grammar: 'て-form + ください — Please do X',
        grammarExample: 'ゆっくり話してください。',
        grammarReading: 'ゆっくりはなしてください。',
        grammarTranslation: 'Please speak slowly.',
        vocab: [
          { word: 'ゆっくり', reading: 'ゆっくり', meaning: 'slowly' },
          { word: 'もう一度', reading: 'もういちど', meaning: 'one more time' },
          { word: '助けて', reading: 'たすけて', meaning: 'help me' },
          { word: '教える', reading: 'おしえる', meaning: 'to teach/tell' }
        ],
        tip: 'て-form is very important in Japanese. It connects actions and makes requests.'
      },
      {
        id: 10,
        title: 'Wanting: ～たい',
        grammar: '～たい — Want to do',
        grammarExample: '日本に行きたいです。',
        grammarReading: 'にほんにいきたいです。',
        grammarTranslation: 'I want to go to Japan.',
        vocab: [
          { word: '日本', reading: 'にほん', meaning: 'Japan' },
          { word: '旅行', reading: 'りょこう', meaning: 'travel' },
          { word: '食べたい', reading: 'たべたい', meaning: 'want to eat' },
          { word: '会いたい', reading: 'あいたい', meaning: 'want to meet' }
        ],
        tip: '～たい is formed by replacing ます with たい. It expresses desire to do something.'
      }
    ]
  }
]

export default function Lessons() {
  const [progress, setProgress] = useState<LessonProgressRecord[]>([])
  const [expandedUnit, setExpandedUnit] = useState<number | null>(1)
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null)
  const [completing, setCompleting] = useState<number | null>(null)

  useEffect(() => {
    loadProgress()
  }, [])

  async function loadProgress() {
    try {
      const p = await getLessonProgress() as LessonProgressRecord[]
      setProgress(p)
    } catch (err) {
      console.error(err)
    }
  }

  function isCompleted(unitId: number, lessonId: number): boolean {
    return progress.some(p => p.unit_id === unitId && p.lesson_id === lessonId && p.completed === 1)
  }

  function getUnitCompletedCount(unit: Unit): number {
    return unit.lessons.filter(l => isCompleted(unit.id, l.id)).length
  }

  function isUnitUnlocked(unitIndex: number): boolean {
    if (unitIndex === 0) return true
    const prevUnit = CURRICULUM[unitIndex - 1]
    return getUnitCompletedCount(prevUnit) >= prevUnit.lessons.length
  }

  async function handleMarkComplete(unitId: number, lessonId: number) {
    setCompleting(lessonId)
    try {
      await markLessonComplete(unitId, lessonId)
      await loadProgress()
    } catch (err) {
      console.error(err)
    } finally {
      setCompleting(null)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-1">Lessons</h2>
        <p className="text-slate-400">Structured JLPT N5 curriculum</p>
      </div>

      <div className="space-y-4">
        {CURRICULUM.map((unit, unitIndex) => {
          const unlocked = isUnitUnlocked(unitIndex)
          const completedCount = getUnitCompletedCount(unit)
          const isExpanded = expandedUnit === unit.id

          return (
            <div
              key={unit.id}
              className={`rounded-xl border transition-all duration-200 ${
                unlocked ? 'border-slate-700' : 'border-slate-800 opacity-60'
              }`}
              style={{ backgroundColor: unlocked ? unit.bgColor : '#1a1a2e' }}
            >
              {/* Unit header */}
              <button
                onClick={() => unlocked && setExpandedUnit(isExpanded ? null : unit.id)}
                disabled={!unlocked}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <div className="flex items-center gap-4">
                  {!unlocked && <span className="text-slate-500">🔒</span>}
                  <div>
                    <h3
                      className="font-bold text-lg"
                      style={{ color: unlocked ? unit.color : '#4b5563' }}
                    >
                      {unit.title}
                    </h3>
                    <p className="text-slate-400 text-sm">{unit.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 text-sm">
                    {completedCount} / {unit.lessons.length} complete
                  </span>
                  {unlocked && (
                    <span className="text-slate-500 text-lg">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </button>

              {/* Lessons list */}
              {isExpanded && unlocked && (
                <div className="px-6 pb-4 space-y-3">
                  {unit.lessons.map(lesson => {
                    const done = isCompleted(unit.id, lesson.id)
                    const isLessonExpanded = expandedLesson === lesson.id

                    return (
                      <div
                        key={lesson.id}
                        className="bg-[#12121f] rounded-lg border border-slate-800"
                      >
                        <button
                          onClick={() => setExpandedLesson(isLessonExpanded ? null : lesson.id)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                done ? 'bg-[#6A994E] text-white' : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              {done ? '✓' : lesson.id}
                            </div>
                            <span className={`font-medium text-sm ${done ? 'text-slate-300' : 'text-white'}`}>
                              {lesson.title}
                            </span>
                          </div>
                          <span className="text-slate-600 text-sm">{isLessonExpanded ? '▲' : '▼'}</span>
                        </button>

                        {isLessonExpanded && (
                          <div className="px-4 pb-4 fade-in">
                            {/* Grammar point */}
                            <div className="mb-4 p-4 bg-[#0f0f1a] rounded-lg border border-slate-800">
                              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Grammar Point</div>
                              <div
                                className="font-bold mb-3 text-base"
                                style={{ color: unit.color }}
                              >
                                {lesson.grammar}
                              </div>
                              <div className="japanese-text">
                                <div className="text-white text-xl mb-1">{lesson.grammarExample}</div>
                                {lesson.grammarReading && (
                                  <div className="text-slate-500 text-lg mb-1">{lesson.grammarReading}</div>
                                )}
                                <div className="text-slate-400 text-base italic">{lesson.grammarTranslation}</div>
                              </div>
                              {lesson.tip && (
                                <div className="mt-3 pt-3 border-t border-slate-800">
                                  <div className="text-[#E8A838] text-sm font-medium mb-1">💡 Tip</div>
                                  <p className="text-slate-400 text-sm leading-relaxed">{lesson.tip}</p>
                                </div>
                              )}
                            </div>

                            {/* Vocabulary */}
                            <div className="mb-4">
                              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Vocabulary</div>
                              <div className="grid grid-cols-2 gap-2">
                                {lesson.vocab.map((v, i) => (
                                  <div
                                    key={i}
                                    className="bg-[#0f0f1a] rounded-lg p-3 border border-slate-800"
                                  >
                                    <div className="text-white font-medium japanese-text text-2xl">{v.word}</div>
                                    <div className="text-slate-500 text-base japanese-text">{v.reading}</div>
                                    <div className="text-slate-400 text-base mt-1">{v.meaning}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Complete button */}
                            {!done ? (
                              <button
                                onClick={() => handleMarkComplete(unit.id, lesson.id)}
                                disabled={completing === lesson.id}
                                className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-150 active:scale-95 text-white"
                                style={{ backgroundColor: unit.color }}
                              >
                                {completing === lesson.id ? 'Marking complete...' : '✓ Mark as Complete (+50 XP)'}
                              </button>
                            ) : (
                              <div className="w-full py-2.5 rounded-lg text-center text-sm text-[#6A994E] bg-[#6A994E10] border border-[#6A994E30]">
                                ✓ Completed
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {!unlocked && (
                <div className="px-6 pb-4 text-slate-600 text-sm">
                  Complete all lessons in the previous unit to unlock.
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
