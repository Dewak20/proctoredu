# ProctorEdu — Setup Guide untuk Developer

Dokumen ini menjelaskan file dan konfigurasi yang perlu ditambahkan sebelum aplikasi bisa berjalan.

---

## 1. File yang WAJIB dibuat (tidak ada di repo)

### `.env.local`
Buat file ini di root project berdasarkan `.env.local.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Cara dapat nilainya:**
> 1. Buka [supabase.com](https://supabase.com) → pilih project kamu
> 2. Buka **Settings → API**
> 3. Copy: Project URL, anon key, service_role key

---

## 2. Database — Jalankan Migration SQL

File migration ada di: `supabase/migrations/001_initial_schema.sql`

**Cara menjalankan:**
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project → **SQL Editor**
3. Paste seluruh isi `supabase/migrations/001_initial_schema.sql`
4. Klik **Run**

Migration ini akan membuat tabel-tabel berikut:
- `teachers` — profil guru (extend auth.users)
- `question_bank` — bank soal
- `exams` — data ujian
- `exam_questions` — relasi ujian ↔ soal
- `classes` — kelas + token
- `student_sessions` — sesi siswa per ujian
- `answers` — jawaban final siswa
- `answer_drafts` — auto-save sementara
- `violations` — log pelanggaran proctor
- `audit_log` — log edit soal saat ujian aktif

Serta mengaktifkan:
- Row Level Security (RLS) untuk data guru
- Realtime untuk tabel `violations` dan `student_sessions`

---

## 3. (Opsional) Data Dummy untuk Development

File seed ada di: `supabase/seed.sql`

Buka file tersebut, ganti `<TEACHER_UUID>` dengan UUID akun guru yang sudah register, lalu jalankan di SQL Editor.

---

## 4. Deploy ke Vercel

### Environment Variables di Vercel
Buka: **Vercel Dashboard → Project → Settings → Environment Variables**

Tambahkan 4 variabel berikut (untuk environment: Production, Preview, Development):

| Nama | Nilai |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Supabase (**rahasia, jangan expose ke client**) |
| `NEXT_PUBLIC_APP_URL` | URL production, misal `https://proctoredu.vercel.app` |

Setelah menambahkan env vars, lakukan **Redeploy** dari Vercel Dashboard.

---

## 5. (Opsional) Google Apps Script untuk Import Soal

Jika fitur import Google Form ingin digunakan:

1. Buka Google Form yang berisi soal
2. Klik **Extensions → Apps Script**
3. Paste seluruh isi file `scripts/google-apps-script.js`
4. Klik **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy URL hasil deploy
6. Paste URL tersebut di wizard buat ujian ProctorEdu (Step: Import Google Form)

> **Catatan:** Kunci jawaban tidak bisa diambil otomatis dari Google Form. Guru perlu mengisi kunci jawaban secara manual setelah import di ProctorEdu.

---

## Ringkasan Checklist

- [ ] Buat file `.env.local` dari `.env.local.example`
- [ ] Jalankan `supabase/migrations/001_initial_schema.sql` di Supabase SQL Editor
- [ ] Tambahkan environment variables di Vercel
- [ ] Redeploy project di Vercel
- [ ] (Opsional) Setup Google Apps Script untuk import soal
- [ ] (Opsional) Jalankan `supabase/seed.sql` untuk data dummy
