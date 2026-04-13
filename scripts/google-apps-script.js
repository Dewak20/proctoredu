/**
 * ProctorEdu - Google Form Exporter
 * 
 * Cara penggunaan:
 * 1. Buka Google Form kamu
 * 2. Klik Extensions > Apps Script
 * 3. Paste seluruh kode ini
 * 4. Klik Deploy > New Deployment
 * 5. Pilih type: Web App
 * 6. Execute as: Me, Who has access: Anyone
 * 7. Deploy & copy URL-nya
 * 8. Paste URL di ProctorEdu saat import soal
 *
 * CATATAN: Kunci jawaban tidak bisa diambil otomatis dari Google Form.
 * Isi kunci jawaban secara manual di ProctorEdu setelah import.
 */

function doGet() {
  const form = FormApp.getActiveForm();
  const items = form.getItems();
  const questions = [];

  items.forEach(function(item, index) {
    const type = item.getType();

    if (type === FormApp.ItemType.MULTIPLE_CHOICE) {
      const mcItem = item.asMultipleChoiceItem();
      const choices = mcItem.getChoices().map(function(c) { return c.getValue(); });
      questions.push({
        urutan: index + 1,
        tipe: 'pilgan',
        teks_soal: item.getTitle(),
        pilihan_a: choices[0] || '',
        pilihan_b: choices[1] || '',
        pilihan_c: choices[2] || '',
        pilihan_d: choices[3] || '',
        kunci_jawaban: null // Isi manual di ProctorEdu
      });
    }

    if (type === FormApp.ItemType.TEXT) {
      questions.push({
        urutan: index + 1,
        tipe: 'isian',
        teks_soal: item.getTitle(),
        kunci_jawaban: null // Isi manual di ProctorEdu
      });
    }
  });

  return ContentService
    .createTextOutput(JSON.stringify({ questions: questions }))
    .setMimeType(ContentService.MimeType.JSON);
}
