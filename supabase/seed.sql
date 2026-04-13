-- Seed data untuk development
-- Jalankan setelah 001_initial_schema.sql
-- Ganti <TEACHER_UUID> dengan UUID guru yang sudah register

-- Contoh soal bank
-- INSERT INTO question_bank (teacher_id, mata_pelajaran, tipe, teks_soal, pilihan_a, pilihan_b, pilihan_c, pilihan_d, kunci_jawaban)
-- VALUES
--   ('<TEACHER_UUID>', 'Matematika', 'pilgan', 'Berapakah 2 + 2?', '2', '3', '4', '5', 'c'),
--   ('<TEACHER_UUID>', 'Matematika', 'isian', 'Ibu kota Indonesia adalah...', NULL, NULL, NULL, NULL, 'Jakarta'),
--   ('<TEACHER_UUID>', 'Bahasa Indonesia', 'essay', 'Ceritakan pengalaman belajar online kamu!', NULL, NULL, NULL, NULL, NULL);
