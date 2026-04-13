export type TeacherProfile = {
  id: string
  nama: string
  sekolah: string | null
  created_at: string
}

export type QuestionType = 'pilgan' | 'essay' | 'isian'

export type Question = {
  id: string
  teacher_id: string
  mata_pelajaran: string | null
  tipe: QuestionType
  teks_soal: string
  pilihan_a: string | null
  pilihan_b: string | null
  pilihan_c: string | null
  pilihan_d: string | null
  kunci_jawaban: string | null
  tags: string[] | null
  created_at: string
}

export type ExamStatus = 'draft' | 'aktif' | 'selesai'
export type ExamSource = 'manual' | 'google_form'

export type Exam = {
  id: string
  teacher_id: string
  judul: string
  mata_pelajaran: string | null
  durasi_menit: number
  sumber: ExamSource
  form_url: string | null
  status: ExamStatus
  bobot_pilgan: number
  bobot_essay: number
  created_at: string
}

export type ExamQuestion = {
  id: string
  exam_id: string
  question_id: string
  urutan: number
  question_bank?: Question
}

export type Class = {
  id: string
  exam_id: string
  nama_kelas: string
  token: string
  aktif: boolean
  siswa_list: string[] | null
  created_at: string
}

export type StudentStatus = 'mengerjakan' | 'selesai' | 'timeout'

export type StudentSession = {
  id: string
  class_id: string
  nama_siswa: string
  mulai_at: string | null
  selesai_at: string | null
  skor_pilgan: number | null
  skor_isian: number | null
  skor_essay: number | null
  skor_total: number | null
  status_essay: 'belum_dinilai' | 'selesai'
  status: StudentStatus
  created_at: string
  classes?: Class
}

export type Answer = {
  id: string
  session_id: string
  question_id: string
  tipe: QuestionType
  jawaban_siswa: string | null
  benar: boolean | null
  nilai_manual: number | null
  dinilai_at: string | null
  created_at: string
  question_bank?: Question
}

export type ViolationType = 'tab_switch' | 'fullscreen_exit' | 'blur' | 'copy_attempt'

export type Violation = {
  id: string
  session_id: string
  jenis: ViolationType
  waktu: string
  durasi_detik: number | null
}
