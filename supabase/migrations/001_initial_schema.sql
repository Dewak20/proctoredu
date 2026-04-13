-- =============================================
-- ProctorEdu - Initial Schema
-- =============================================

-- 1. teachers (extends auth.users)
CREATE TABLE teachers (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama        TEXT NOT NULL,
  sekolah     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. question_bank
CREATE TABLE question_bank (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id      UUID REFERENCES teachers(id) ON DELETE CASCADE,
  mata_pelajaran  TEXT,
  tipe            TEXT CHECK (tipe IN ('pilgan', 'essay', 'isian')) DEFAULT 'pilgan',
  teks_soal       TEXT NOT NULL,
  pilihan_a       TEXT,
  pilihan_b       TEXT,
  pilihan_c       TEXT,
  pilihan_d       TEXT,
  kunci_jawaban   TEXT,
  tags            TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. exams
CREATE TABLE exams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id      UUID REFERENCES teachers(id) ON DELETE CASCADE,
  judul           TEXT NOT NULL,
  mata_pelajaran  TEXT,
  durasi_menit    INTEGER NOT NULL DEFAULT 60,
  sumber          TEXT CHECK (sumber IN ('manual', 'google_form')) DEFAULT 'manual',
  form_url        TEXT,
  status          TEXT CHECK (status IN ('draft', 'aktif', 'selesai')) DEFAULT 'draft',
  bobot_pilgan    NUMERIC(5,2) DEFAULT 70,
  bobot_essay     NUMERIC(5,2) DEFAULT 30,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. exam_questions
CREATE TABLE exam_questions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id      UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_id  UUID REFERENCES question_bank(id) ON DELETE CASCADE,
  urutan       INTEGER NOT NULL,
  UNIQUE(exam_id, question_id)
);

-- 5. classes
CREATE TABLE classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id     UUID REFERENCES exams(id) ON DELETE CASCADE,
  nama_kelas  TEXT NOT NULL,
  token       TEXT UNIQUE NOT NULL,
  aktif       BOOLEAN DEFAULT FALSE,
  siswa_list  TEXT[],
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. student_sessions
CREATE TABLE student_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id        UUID REFERENCES classes(id) ON DELETE CASCADE,
  nama_siswa      TEXT NOT NULL,
  mulai_at        TIMESTAMPTZ,
  selesai_at      TIMESTAMPTZ,
  skor_pilgan     NUMERIC(5,2),
  skor_isian      NUMERIC(5,2),
  skor_essay      NUMERIC(5,2),
  skor_total      NUMERIC(5,2),
  status_essay    TEXT CHECK (status_essay IN ('belum_dinilai', 'selesai')) DEFAULT 'belum_dinilai',
  status          TEXT CHECK (status IN ('mengerjakan', 'selesai', 'timeout')) DEFAULT 'mengerjakan',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, nama_siswa)
);

-- 7. answers
CREATE TABLE answers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES student_sessions(id) ON DELETE CASCADE,
  question_id     UUID REFERENCES question_bank(id),
  tipe            TEXT CHECK (tipe IN ('pilgan', 'essay', 'isian')),
  jawaban_siswa   TEXT,
  benar           BOOLEAN,
  nilai_manual    NUMERIC(5,2),
  dinilai_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 8. answer_drafts
CREATE TABLE answer_drafts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID REFERENCES student_sessions(id) ON DELETE CASCADE,
  question_id  UUID REFERENCES question_bank(id),
  jawaban_draft TEXT,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, question_id)
);

-- 9. violations
CREATE TABLE violations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID REFERENCES student_sessions(id) ON DELETE CASCADE,
  jenis        TEXT CHECK (jenis IN ('tab_switch', 'fullscreen_exit', 'blur', 'copy_attempt')),
  waktu        TIMESTAMPTZ DEFAULT NOW(),
  durasi_detik INTEGER
);

-- 10. audit_log
CREATE TABLE audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id      UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_id  UUID REFERENCES question_bank(id),
  teacher_id   UUID REFERENCES teachers(id),
  aksi         TEXT NOT NULL,
  detail       JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security
-- =============================================

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guru akses profil sendiri" ON teachers FOR ALL USING (id = auth.uid());

ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guru akses bank soal sendiri" ON question_bank FOR ALL USING (teacher_id = auth.uid());

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guru akses ujian sendiri" ON exams FOR ALL USING (teacher_id = auth.uid());

ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guru akses soal ujian sendiri" ON exam_questions FOR ALL
  USING (exam_id IN (SELECT id FROM exams WHERE teacher_id = auth.uid()));

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guru akses kelas ujian sendiri" ON classes FOR ALL
  USING (exam_id IN (SELECT id FROM exams WHERE teacher_id = auth.uid()));

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guru akses audit log sendiri" ON audit_log FOR ALL USING (teacher_id = auth.uid());

-- student_sessions, answers, answer_drafts, violations:
-- Diakses melalui API routes dengan SUPABASE_SERVICE_ROLE_KEY (bypass RLS)

-- =============================================
-- Realtime untuk live monitor
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE violations;
ALTER PUBLICATION supabase_realtime ADD TABLE student_sessions;
