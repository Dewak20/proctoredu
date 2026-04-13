'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { QuestionType } from '@/types'

export interface SoalFormData {
  mata_pelajaran: string
  tipe: QuestionType
  teks_soal: string
  pilihan_a: string
  pilihan_b: string
  pilihan_c: string
  pilihan_d: string
  kunci_jawaban: string
  tags: string
}

interface SoalFormProps {
  initialData?: Partial<SoalFormData>
  onSubmit: (data: SoalFormData) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

export default function SoalForm({ initialData, onSubmit, onCancel, submitLabel = 'Simpan' }: SoalFormProps) {
  const [form, setForm] = useState<SoalFormData>({
    mata_pelajaran: initialData?.mata_pelajaran || '',
    tipe: initialData?.tipe || 'pilgan',
    teks_soal: initialData?.teks_soal || '',
    pilihan_a: initialData?.pilihan_a || '',
    pilihan_b: initialData?.pilihan_b || '',
    pilihan_c: initialData?.pilihan_c || '',
    pilihan_d: initialData?.pilihan_d || '',
    kunci_jawaban: initialData?.kunci_jawaban || '',
    tags: initialData?.tags || '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof SoalFormData, string>>>({})

  const validate = () => {
    const errs: typeof errors = {}
    if (!form.teks_soal.trim()) errs.teks_soal = 'Teks soal tidak boleh kosong'
    if (form.tipe === 'pilgan') {
      if (!form.pilihan_a.trim()) errs.pilihan_a = 'Pilihan A wajib diisi'
      if (!form.pilihan_b.trim()) errs.pilihan_b = 'Pilihan B wajib diisi'
      if (!form.kunci_jawaban) errs.kunci_jawaban = 'Kunci jawaban wajib dipilih'
    }
    if (form.tipe === 'isian' && !form.kunci_jawaban.trim()) errs.kunci_jawaban = 'Kunci jawaban wajib diisi'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try { await onSubmit(form) } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Mata Pelajaran" value={form.mata_pelajaran} onChange={(e) => setForm({ ...form, mata_pelajaran: e.target.value })} placeholder="Matematika, IPA, dll" />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Tipe Soal</label>
          <select value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value as QuestionType, kunci_jawaban: '' })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none">
            <option value="pilgan">Pilihan Ganda</option>
            <option value="isian">Isian Singkat</option>
            <option value="essay">Essay</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Teks Soal</label>
        <textarea value={form.teks_soal} onChange={(e) => setForm({ ...form, teks_soal: e.target.value })} rows={4} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none" placeholder="Tulis teks soal di sini..." />
        {errors.teks_soal && <p className="text-xs text-red-600">{errors.teks_soal}</p>}
      </div>

      {form.tipe === 'pilgan' && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Pilihan Jawaban</p>
          {(['a', 'b', 'c', 'd'] as const).map((opt) => {
            const key = `pilihan_${opt}` as keyof SoalFormData
            return (
              <div key={opt} className="flex items-start gap-3">
                <span className="mt-2 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 uppercase flex-shrink-0">{opt}</span>
                <div className="flex-1">
                  <Input value={form[key] as string} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={`Pilihan ${opt.toUpperCase()}`} error={errors[key]} />
                </div>
              </div>
            )
          })}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Kunci Jawaban</label>
            <div className="flex gap-3">
              {(['a', 'b', 'c', 'd'] as const).map((opt) => (
                <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="kunci" value={opt} checked={form.kunci_jawaban === opt} onChange={(e) => setForm({ ...form, kunci_jawaban: e.target.value })} className="text-indigo-600" />
                  <span className="text-sm font-medium uppercase">{opt}</span>
                </label>
              ))}
            </div>
            {errors.kunci_jawaban && <p className="text-xs text-red-600">{errors.kunci_jawaban}</p>}
          </div>
        </div>
      )}

      {form.tipe === 'isian' && (
        <Input label="Kunci Jawaban" value={form.kunci_jawaban} onChange={(e) => setForm({ ...form, kunci_jawaban: e.target.value })} placeholder="Jawaban yang benar (case-insensitive)" error={errors.kunci_jawaban} />
      )}

      {form.tipe === 'essay' && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
          Soal essay dinilai manual oleh guru setelah ujian selesai.
        </div>
      )}

      <Input label="Tags (opsional)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="bab1, persamaan, dll (pisahkan dengan koma)" />

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Batal</Button>}
        <Button type="submit" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  )
}
