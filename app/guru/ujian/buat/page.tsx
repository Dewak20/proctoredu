'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toast'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import SoalForm, { SoalFormData } from '@/components/guru/SoalForm'
import KelasManager from '@/components/guru/KelasManager'
import { Question, Class } from '@/types'
import { generateToken } from '@/lib/token'

type Step = 1 | 2 | 3 | 4
type Sumber = 'manual' | 'bank_soal' | 'google_form'

interface ExamInfo {
  judul: string
  mata_pelajaran: string
  durasi_menit: number
  bobot_pilgan: number
  bobot_essay: number
}

const STEP_LABELS = ['Info Ujian', 'Sumber Soal', 'Tambah Soal', 'Kelas & Token']

export default function BuatUjianPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [info, setInfo] = useState<ExamInfo>({
    judul: '', mata_pelajaran: '', durasi_menit: 60, bobot_pilgan: 70, bobot_essay: 30,
  })
  const [sumber, setSumber] = useState<Sumber>('manual')
  const [questions, setQuestions] = useState<Question[]>([])
  const [bankSoal, setBankSoal] = useState<Question[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [classes, setClasses] = useState<Omit<Class, 'id' | 'exam_id' | 'created_at'>[]>([])
  const [formUrl, setFormUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadBankSoal = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('question_bank').select('*').order('created_at', { ascending: false })
    setBankSoal(data || [])
  }

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!info.judul.trim()) { toast.error('Judul ujian wajib diisi'); return }
    setStep(2)
  }

  const handleStep2 = (s: Sumber) => {
    setSumber(s)
    if (s === 'bank_soal') loadBankSoal()
    setStep(3)
  }

  const handleAddSoalManual = async (data: SoalFormData) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const tags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    const { data: q, error } = await supabase.from('question_bank').insert({
      teacher_id: user.id,
      mata_pelajaran: data.mata_pelajaran || null,
      tipe: data.tipe, teks_soal: data.teks_soal,
      pilihan_a: data.pilihan_a || null, pilihan_b: data.pilihan_b || null,
      pilihan_c: data.pilihan_c || null, pilihan_d: data.pilihan_d || null,
      kunci_jawaban: data.kunci_jawaban || null,
      tags: tags.length > 0 ? tags : null,
    }).select().single()
    if (error) { toast.error('Gagal menambah soal'); return }
    setQuestions(prev => [...prev, q])
    toast.success('Soal ditambahkan')
  }

  const handleImportForm = async () => {
    if (!formUrl.trim()) { toast.error('URL wajib diisi'); return }
    setImporting(true)
    try {
      const res = await fetch('/api/import-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formUrl }),
      })
      if (!res.ok) throw new Error()
      const { questions: imported } = await res.json()
      setQuestions(imported)
      toast.success(`${imported.length} soal berhasil diimport`)
    } catch {
      toast.error('Gagal mengimport dari Google Form')
    } finally { setImporting(false) }
  }

  const handleFinish = async () => {
    if (sumber === 'bank_soal') {
      const selected = bankSoal.filter(q => selectedIds.has(q.id))
      if (selected.length === 0) { toast.error('Pilih minimal 1 soal'); return }
    } else if (questions.length === 0) { toast.error('Tambah minimal 1 soal'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: exam, error: examErr } = await supabase.from('exams').insert({
        teacher_id: user.id, judul: info.judul,
        mata_pelajaran: info.mata_pelajaran || null,
        durasi_menit: info.durasi_menit,
        sumber: sumber === 'bank_soal' ? 'manual' : (sumber === 'google_form' ? 'google_form' : 'manual'),
        form_url: formUrl || null,
        bobot_pilgan: info.bobot_pilgan, bobot_essay: info.bobot_essay,
      }).select().single()
      if (examErr) throw examErr

      const finalQuestions = sumber === 'bank_soal' ? bankSoal.filter(q => selectedIds.has(q.id)) : questions
      if (finalQuestions.length > 0) {
        await supabase.from('exam_questions').insert(
          finalQuestions.map((q, i) => ({ exam_id: exam.id, question_id: q.id, urutan: i + 1 }))
        )
      }

      for (const cls of classes) {
        await supabase.from('classes').insert({ exam_id: exam.id, ...cls })
      }

      toast.success('Ujian berhasil dibuat!')
      router.push(`/guru/ujian/${exam.id}`)
    } catch { toast.error('Gagal membuat ujian') } finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              step > i + 1 ? 'bg-indigo-600 text-white' : step === i + 1 ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-600' : 'bg-gray-100 text-gray-400'
            }`}>{i + 1}</div>
            <span className={`text-sm hidden sm:block ${step === i + 1 ? 'font-medium text-gray-900' : 'text-gray-400'}`}>{label}</span>
            {i < 3 && <div className="h-px w-6 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Info Ujian</h2>
          <form onSubmit={handleStep1} className="space-y-4">
            <Input label="Judul Ujian" value={info.judul} onChange={e => setInfo({ ...info, judul: e.target.value })} placeholder="UTS Matematika Semester 1" required />
            <Input label="Mata Pelajaran" value={info.mata_pelajaran} onChange={e => setInfo({ ...info, mata_pelajaran: e.target.value })} placeholder="Matematika" />
            <Input label="Durasi (menit)" type="number" value={info.durasi_menit} onChange={e => setInfo({ ...info, durasi_menit: parseInt(e.target.value) || 60 })} min={5} max={300} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Bobot Pilgan+Isian (%)" type="number" value={info.bobot_pilgan} onChange={e => setInfo({ ...info, bobot_pilgan: parseInt(e.target.value) || 70 })} min={0} max={100} />
              <Input label="Bobot Essay (%)" type="number" value={info.bobot_essay} onChange={e => setInfo({ ...info, bobot_essay: parseInt(e.target.value) || 30 })} min={0} max={100} />
            </div>
            <div className="flex justify-end"><Button type="submit">Lanjut &rarr;</Button></div>
          </form>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Pilih Sumber Soal</h2>
          <div className="space-y-3">
            {[
              { key: 'manual', icon: '✏️', label: 'Input Manual', desc: 'Buat soal satu per satu langsung' },
              { key: 'bank_soal', icon: '📚', label: 'Dari Bank Soal', desc: 'Pilih soal yang sudah tersimpan' },
              { key: 'google_form', icon: '📝', label: 'Google Form', desc: 'Pakai Google Form kamu — ProctorEdu jadi pengawasnya' },
            ].map(opt => (
              <button key={opt.key} onClick={() => handleStep2(opt.key as Sumber)}
                className="w-full flex items-start gap-4 rounded-xl border-2 border-gray-200 p-4 text-left hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                <span className="text-2xl">{opt.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{opt.label}</p>
                  <p className="text-sm text-gray-500">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="flex justify-start mt-4">
            <Button variant="ghost" onClick={() => setStep(1)}>&larr; Kembali</Button>
          </div>
        </Card>
      )}

      {/* Step 3: Manual */}
      {step === 3 && sumber === 'manual' && (
        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold text-gray-900 mb-4">Tambah Soal ({questions.length} soal)</h2>
            <SoalForm onSubmit={handleAddSoalManual} submitLabel="+ Tambah Soal" />
          </Card>
          {questions.length > 0 && (
            <Card>
              <p className="text-sm font-medium text-gray-700 mb-3">Soal yang ditambahkan:</p>
              <div className="space-y-2">
                {questions.map((q, i) => (
                  <div key={q.id} className="flex items-start gap-2 text-sm">
                    <span className="text-gray-400 w-5">{i + 1}.</span>
                    <span className="text-gray-700 line-clamp-1">{q.teks_soal}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>&larr; Kembali</Button>
            <Button onClick={() => setStep(4)} disabled={questions.length === 0}>Lanjut &rarr;</Button>
          </div>
        </div>
      )}

      {/* Step 3: Bank Soal */}
      {step === 3 && sumber === 'bank_soal' && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Pilih dari Bank Soal ({selectedIds.size} dipilih)</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {bankSoal.map(q => (
              <label key={q.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={selectedIds.has(q.id)}
                  onChange={() => setSelectedIds(prev => {
                    const next = new Set(prev)
                    next.has(q.id) ? next.delete(q.id) : next.add(q.id)
                    return next
                  })}
                  className="mt-0.5 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-800 line-clamp-2">{q.teks_soal}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{q.tipe} {q.mata_pelajaran ? `· ${q.mata_pelajaran}` : ''}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            <Button variant="ghost" onClick={() => setStep(2)}>&larr; Kembali</Button>
            <Button onClick={() => setStep(4)} disabled={selectedIds.size === 0}>Lanjut &rarr;</Button>
          </div>
        </Card>
      )}

      {/* Step 3: Google Form */}
      {step === 3 && sumber === 'google_form' && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-1">Google Form sebagai Soal Ujian</h2>
          <p className="text-sm text-gray-500 mb-4">
            Siswa mengerjakan Google Form kamu di dalam ProctorEdu — fullscreen &amp; anti-contek aktif otomatis.
            Penilaian tetap dilihat di Google Form Responses.
          </p>
          <div className="space-y-4">
            <Input
              label="Link Google Form"
              value={formUrl}
              onChange={e => setFormUrl(e.target.value)}
              placeholder="https://docs.google.com/forms/d/... atau https://forms.gle/..."
            />
            {formUrl.trim() && (
              <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-xs text-indigo-700 space-y-1">
                <p className="font-medium">Pastikan Google Form kamu:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Bisa diakses siapa saja (tidak memerlukan login Google)</li>
                  <li>Pengiriman dibatasi 1 respons per orang (opsional)</li>
                </ul>
              </div>
            )}
          </div>
          <div className="flex justify-between mt-4">
            <Button variant="ghost" onClick={() => setStep(2)}>&larr; Kembali</Button>
            <Button
              onClick={async () => {
                if (!formUrl.trim()) return
                setImporting(true)
                try {
                  // Resolve forms.gle → full URL
                  if (formUrl.includes('forms.gle')) {
                    const res = await fetch('/api/import-form', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ url: formUrl }),
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error)
                    setFormUrl(data.url)
                  }
                  setStep(4)
                } catch {
                  toast.error('URL tidak valid. Pastikan link Google Form benar.')
                } finally {
                  setImporting(false)
                }
              }}
              loading={importing}
              disabled={!formUrl.trim()}
            >
              Lanjut &rarr;
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Kelas & Token</h2>
          <KelasManager
            classes={classes.map((c, i) => ({ ...c, id: String(i), exam_id: '', created_at: '' }))}
            onAddClass={async (nama, siswaList, token) => {
              setClasses(prev => [...prev, { nama_kelas: nama, token, aktif: false, siswa_list: siswaList }])
            }}
          />
          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => setStep(3)}>&larr; Kembali</Button>
            <Button onClick={handleFinish} loading={saving}>Buat Ujian</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
