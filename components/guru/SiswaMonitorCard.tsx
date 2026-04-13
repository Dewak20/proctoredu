'use client'

import { StudentSession, Violation } from '@/types'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { clsx } from 'clsx'

interface SiswaMonitorCardProps {
  session: StudentSession & { violations?: Violation[] }
  onReset?: (sessionId: string) => void
}

export default function SiswaMonitorCard({ session, onReset }: SiswaMonitorCardProps) {
  const tabSwitches = session.violations?.filter(v => v.jenis === 'tab_switch').length ?? 0
  const copyAttempts = session.violations?.filter(v => v.jenis === 'copy_attempt').length ?? 0

  const getBadge = () => {
    if (session.status === 'selesai') return { v: 'green' as const, l: 'Selesai' }
    if (session.status === 'timeout') return { v: 'gray' as const, l: 'Timeout' }
    if (tabSwitches >= 5) return { v: 'red' as const, l: 'Pelanggaran Berat' }
    if (tabSwitches >= 3) return { v: 'yellow' as const, l: 'Waspada' }
    return { v: 'blue' as const, l: 'Mengerjakan' }
  }
  const badge = getBadge()

  return (
    <div className={clsx(
      'rounded-lg border p-4',
      session.status === 'selesai' ? 'border-green-200 bg-green-50' :
      session.status === 'timeout' ? 'border-gray-200 bg-gray-50' :
      tabSwitches >= 5 ? 'border-red-200 bg-red-50' :
      tabSwitches >= 3 ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-white'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{session.nama_siswa}</p>
          {session.mulai_at && (
            <p className="text-xs text-gray-500 mt-0.5">Mulai: {new Date(session.mulai_at).toLocaleTimeString('id-ID')}</p>
          )}
        </div>
        <Badge variant={badge.v}>{badge.l}</Badge>
      </div>
      {(tabSwitches > 0 || copyAttempts > 0) && (
        <div className="mt-2 flex gap-3 text-xs">
          {tabSwitches > 0 && <span className="text-orange-600">Tab switch: <strong>{tabSwitches}x</strong></span>}
          {copyAttempts > 0 && <span className="text-red-600">Copy: <strong>{copyAttempts}x</strong></span>}
        </div>
      )}
      {session.status === 'selesai' && session.skor_total !== null && (
        <p className="mt-2 text-sm font-medium text-green-700">Skor: {session.skor_total}</p>
      )}
      {session.status === 'mengerjakan' && onReset && (
        <div className="mt-3">
          <Button size="sm" variant="ghost" onClick={() => onReset(session.id)} className="text-xs">Reset Sesi</Button>
        </div>
      )}
    </div>
  )
}
