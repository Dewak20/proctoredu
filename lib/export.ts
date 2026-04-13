'use client'

import { StudentSession, Exam } from '@/types'

export async function exportToExcel(sessions: StudentSession[], exam: Exam) {
  const XLSX = await import('xlsx')
  const data = sessions.map((s, i) => ({
    No: i + 1,
    'Nama Siswa': s.nama_siswa,
    Mulai: s.mulai_at ? new Date(s.mulai_at).toLocaleString('id-ID') : '-',
    Selesai: s.selesai_at ? new Date(s.selesai_at).toLocaleString('id-ID') : '-',
    'Skor Pilgan': s.skor_pilgan ?? '-',
    'Skor Isian': s.skor_isian ?? '-',
    'Skor Essay': s.skor_essay ?? '-',
    'Skor Total': s.skor_total ?? '-',
    Status: s.status,
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Hasil Ujian')
  XLSX.writeFile(wb, `${exam.judul}_hasil.xlsx`)
}

export async function exportToPDF(sessions: StudentSession[], exam: Exam) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(exam.judul, 14, 15)
  doc.setFontSize(10)
  doc.text(`Mata Pelajaran: ${exam.mata_pelajaran || '-'}`, 14, 22)
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 28)
  autoTable(doc, {
    startY: 35,
    head: [['No', 'Nama Siswa', 'Pilgan', 'Isian', 'Essay', 'Total', 'Status']],
    body: sessions.map((s, i) => [
      i + 1, s.nama_siswa,
      s.skor_pilgan ?? '-', s.skor_isian ?? '-',
      s.skor_essay ?? '-', s.skor_total ?? '-', s.status,
    ]),
  })
  doc.save(`${exam.judul}_hasil.pdf`)
}
