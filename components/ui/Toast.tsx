'use client'

import { useEffect, useState } from 'react'
import { clsx } from 'clsx'

type ToastType = 'success' | 'error' | 'warning' | 'info'
interface ToastMessage { id: string; type: ToastType; message: string }

let addToastFn: ((t: Omit<ToastMessage, 'id'>) => void) | null = null

export function toast(type: ToastType, message: string) {
  addToastFn?.({ type, message })
}
toast.success = (m: string) => toast('success', m)
toast.error = (m: string) => toast('error', m)
toast.warning = (m: string) => toast('warning', m)
toast.info = (m: string) => toast('info', m)

const icons: Record<ToastType, string> = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' }
const styles: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  useEffect(() => {
    addToastFn = ({ type, message }) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((p) => [...p, { id, type, message }])
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000)
    }
    return () => { addToastFn = null }
  }, [])
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <div key={t.id} className={clsx('flex items-start gap-3 px-4 py-3 rounded-lg border shadow-md text-sm', styles[t.type])}>
          <span className="font-bold">{icons[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
