'use client'

import { useState, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'

interface TimerCountdownProps {
  durasiMenit: number
  mulaiAt: string
  onTimeout: () => void
}

export default function TimerCountdown({ durasiMenit, mulaiAt, onTimeout }: TimerCountdownProps) {
  const endTime = new Date(mulaiAt).getTime() + durasiMenit * 60 * 1000
  const getRemaining = useCallback(() => Math.max(0, Math.round((endTime - Date.now()) / 1000)), [endTime])
  const [remaining, setRemaining] = useState(getRemaining)

  useEffect(() => {
    const interval = setInterval(() => {
      const sisa = getRemaining()
      setRemaining(sisa)
      if (sisa === 0) { clearInterval(interval); onTimeout() }
    }, 1000)
    return () => clearInterval(interval)
  }, [getRemaining, onTimeout])

  const mnt = Math.floor(remaining / 60)
  const det = remaining % 60
  const label = `${String(mnt).padStart(2, '0')}:${String(det).padStart(2, '0')}`
  const isRed = remaining <= 5 * 60
  const isOrange = remaining <= 10 * 60 && !isRed
  const isYellow = remaining <= 30 * 60 && !isOrange && !isRed

  return (
    <div className={clsx(
      'flex items-center gap-1.5 rounded-lg px-3 py-1.5',
      isRed ? 'bg-red-100 border-2 border-red-400 animate-pulse' :
      isOrange ? 'bg-orange-100 border border-orange-300' :
      isYellow ? 'bg-yellow-100 border border-yellow-300' : 'bg-white border border-gray-200'
    )}>
      <span className={clsx('text-xs text-gray-400 hidden sm:inline')}>Sisa</span>
      <span className={clsx('font-mono text-base font-bold tabular-nums', isRed ? 'text-red-600' : isOrange ? 'text-orange-600' : isYellow ? 'text-yellow-700' : 'text-gray-900')}>
        {label}
      </span>
    </div>
  )
}
