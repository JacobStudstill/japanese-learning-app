export interface CardUpdate {
  interval: number
  easeFactor: number
  repetitions: number
  dueDate: string
  status: 'learning' | 'review'
}

/**
 * SM-2 spaced repetition algorithm
 * rating: 1=Again, 2=Hard, 3=Good, 4=Easy
 */
export function calculateNextReview(
  rating: 1 | 2 | 3 | 4,
  currentInterval: number,
  easeFactor: number,
  repetitions: number
): CardUpdate {
  const MIN_EASE = 1.3

  let newInterval = currentInterval
  let newEase = easeFactor
  let newReps = repetitions
  let newStatus: 'learning' | 'review' = 'review'

  switch (rating) {
    case 1: // Again — reset
      newInterval = 1
      newReps = 0
      newEase = Math.max(MIN_EASE, easeFactor - 0.2)
      newStatus = 'learning'
      break

    case 2: // Hard — slow growth
      newInterval = Math.max(1, Math.round(currentInterval * 1.2))
      newEase = Math.max(MIN_EASE, easeFactor - 0.15)
      newReps = repetitions + 1
      newStatus = newReps < 2 ? 'learning' : 'review'
      break

    case 3: // Good — standard SM-2 intervals
      if (repetitions === 0) {
        newInterval = 1
      } else if (repetitions === 1) {
        newInterval = 4
      } else {
        newInterval = Math.round(currentInterval * easeFactor)
      }
      newEase = easeFactor
      newReps = repetitions + 1
      newStatus = newReps < 2 ? 'learning' : 'review'
      break

    case 4: // Easy — accelerated growth
      if (repetitions === 0) {
        newInterval = 4
      } else if (repetitions === 1) {
        newInterval = 7
      } else {
        newInterval = Math.round(currentInterval * easeFactor * 1.3)
      }
      newEase = Math.min(4.0, easeFactor + 0.15)
      newReps = repetitions + 1
      newStatus = 'review'
      break
  }

  // Cap interval at 365 days
  newInterval = Math.min(365, Math.max(1, newInterval))

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + newInterval)
  const dueDateStr = dueDate.toISOString().slice(0, 10)

  return {
    interval: newInterval,
    easeFactor: newEase,
    repetitions: newReps,
    dueDate: dueDateStr,
    status: newStatus
  }
}

export function getRatingLabel(rating: 1 | 2 | 3 | 4): string {
  const labels = { 1: 'Again', 2: 'Hard', 3: 'Good', 4: 'Easy' }
  return labels[rating]
}

export function getRatingColor(rating: 1 | 2 | 3 | 4): string {
  const colors = {
    1: 'bg-red-600 hover:bg-red-500',
    2: 'bg-orange-600 hover:bg-orange-500',
    3: 'bg-green-600 hover:bg-green-500',
    4: 'bg-blue-600 hover:bg-blue-500'
  }
  return colors[rating]
}

export function formatNextReview(interval: number): string {
  if (interval === 1) return 'tomorrow'
  if (interval < 7) return `${interval} days`
  if (interval < 30) return `${Math.round(interval / 7)} weeks`
  if (interval < 365) return `${Math.round(interval / 30)} months`
  return `${Math.round(interval / 365)} years`
}
