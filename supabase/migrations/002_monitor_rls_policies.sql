-- =============================================
-- RLS policies: guru akses data ujian miliknya
-- INSERT/UPDATE siswa tetap via service_role (bypass RLS)
-- =============================================

-- Live monitor: guru SELECT sesi dan pelanggaran ujiannya
CREATE POLICY "teachers_select_student_sessions"
ON student_sessions FOR SELECT
USING (
  class_id IN (
    SELECT id FROM classes
    WHERE exam_id IN (
      SELECT id FROM exams WHERE teacher_id = auth.uid()
    )
  )
);

CREATE POLICY "teachers_select_violations"
ON violations FOR SELECT
USING (
  session_id IN (
    SELECT id FROM student_sessions
    WHERE class_id IN (
      SELECT id FROM classes
      WHERE exam_id IN (
        SELECT id FROM exams WHERE teacher_id = auth.uid()
      )
    )
  )
);

-- Nilai essay: guru SELECT & UPDATE jawaban ujiannya
CREATE POLICY "teachers_select_answers"
ON answers FOR SELECT
USING (
  session_id IN (
    SELECT id FROM student_sessions
    WHERE class_id IN (
      SELECT id FROM classes
      WHERE exam_id IN (
        SELECT id FROM exams WHERE teacher_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "teachers_update_answers"
ON answers FOR UPDATE
USING (
  session_id IN (
    SELECT id FROM student_sessions
    WHERE class_id IN (
      SELECT id FROM classes
      WHERE exam_id IN (
        SELECT id FROM exams WHERE teacher_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "teachers_select_answer_drafts"
ON answer_drafts FOR SELECT
USING (
  session_id IN (
    SELECT id FROM student_sessions
    WHERE class_id IN (
      SELECT id FROM classes
      WHERE exam_id IN (
        SELECT id FROM exams WHERE teacher_id = auth.uid()
      )
    )
  )
);
