import { create } from 'zustand'

export interface TimeParts {
  hours: number
  minutes: number
  seconds: number
}

interface TimerState {
  duration: number
  remaining: number
  remainingMs: number
  endTime: number | null
  isRunning: boolean

  setDuration: (parts: { hours?: number; minutes?: number; seconds?: number }) => void
  start: () => void
  pause: () => void
  reset: () => void
  toggle: () => void
  formatTime: (totalSeconds: number) => string
}

const TICK_MS = 100

let intervalId: ReturnType<typeof setInterval> | null = null

const clearTimer = () => {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

export const useTimerStore = create<TimerState>()((set, get) => {
  const tick = () => {
    const { endTime, remaining } = get()
    if (endTime === null) return

    const remainingMs = Math.max(0, endTime - Date.now())

    if (remainingMs === 0) {
      clearTimer()
      set({ remaining: 0, remainingMs: 0, endTime: null, isRunning: false })
      return
    }

    const nextRemaining = Math.ceil(remainingMs / 1000)
    if (nextRemaining !== remaining) {
      set({ remaining: nextRemaining, remainingMs })
    } else {
      set({ remainingMs })
    }
  }

  return {
    duration: 60,
    remaining: 60,
    remainingMs: 60_000,
    endTime: null,
    isRunning: false,

    setDuration: ({ hours, minutes, seconds }) => {
      clearTimer()
      const total = Math.max(
        0,
        (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0)
      )
      set({
        duration: total,
        remaining: total,
        remainingMs: total * 1000,
        endTime: null,
        isRunning: false,
      })
    },

    start: () => {
      const { isRunning, remainingMs } = get()
      if (isRunning || remainingMs <= 0) return

      clearTimer()
      set({ isRunning: true, endTime: Date.now() + remainingMs })
      intervalId = setInterval(tick, TICK_MS)
    },

    pause: () => {
      const { endTime, isRunning } = get()
      if (!isRunning || endTime === null) return

      clearTimer()
      const remainingMs = Math.max(0, endTime - Date.now())
      set({
        remainingMs,
        remaining: Math.ceil(remainingMs / 1000),
        endTime: null,
        isRunning: false,
      })
    },

    reset: () => {
      clearTimer()
      const { duration } = get()
      set({
        remaining: duration,
        remainingMs: duration * 1000,
        endTime: null,
        isRunning: false,
      })
    },

    toggle: () => {
      const { isRunning, start, pause } = get()
      if (isRunning) pause()
      else start()
    },

    formatTime: (totalSeconds: number): string => {
      const s = Math.max(0, Math.floor(totalSeconds))
      const hours = Math.floor(s / 3600)
      const minutes = Math.floor((s % 3600) / 60)
      const seconds = s % 60

      const pad = (n: number) => String(n).padStart(2, '0')

      return hours > 0
        ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        : `${pad(minutes)}:${pad(seconds)}`
    },

  }
})