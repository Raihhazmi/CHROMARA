# Backend formulir Kritik & Saran

Formulir ini menggunakan Google Apps Script untuk mengirim masukan ke Gmail pengelola dan meneruskan screenshot sebagai lampiran. Endpoint dibatasi ke 50 kiriman per hari dan menerima screenshot PNG, JPG, atau WebP hingga 3 MB.

Sebelum URL Web app dipasang di `feedback-config.js`, situs akan menolak pengiriman dan menampilkan bahwa formulir belum terhubung. Ini mencegah pesan tampak terkirim padahal belum diteruskan.

## Menyiapkan endpoint

1. Masuk ke [Google Apps Script](https://script.google.com/) dengan akun Google yang mengelola email masukan.
2. Buat project baru, lalu salin isi `Code.gs` ke editor project.
3. Pilih **Deploy > New deployment**, pilih tipe **Web app**, atur **Execute as** ke akun Anda, dan **Who has access** ke **Anyone**.
4. Tekan **Deploy** dan berikan izin yang diminta agar script dapat mengirim email.
5. Salin URL Web app yang berakhiran `/exec`.
6. Isi URL tersebut ke `window.CHROMARA_FEEDBACK_ENDPOINT` pada `feedback-config.js`, tanpa menambahkan token atau kredensial lain.
7. Publikasikan perubahan situs. Uji satu kiriman teks, lalu satu kiriman dengan screenshot.

URL endpoint bersifat publik. Script hanya dapat mengirim ke alamat tetap pengelola, memvalidasi kategori dan isi, membatasi ukuran file, serta menghentikan kiriman setelah kuota harian tercapai. Jangan menaruh token rahasia di `feedback-config.js`.
