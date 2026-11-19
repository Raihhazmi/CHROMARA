const FEEDBACK_RECIPIENT = 'raihanazmi.official@gmail.com';
const ALLOWED_CATEGORIES = ['Lapor Error/Bug', 'Saran Fitur', 'Masalah Tampilan', 'Lainnya'];
const MAX_SCREENSHOT_BYTES = 3 * 1024 * 1024;
const DAILY_LIMIT = 50;

function doPost(e) {
  try {
    const data = e && e.parameter ? e.parameter : {};
    const category = String(data.category || '');
    const message = String(data.message || '').trim();
    const contact = String(data.contact || '').trim();

    if (ALLOWED_CATEGORIES.indexOf(category) === -1) {
      return feedbackResult(false, 'Pilih kategori masukan yang tersedia.');
    }
    if (!message || message.length > 3000) {
      return feedbackResult(false, 'Pesan wajib diisi dan maksimal 3.000 karakter.');
    }
    if (contact.length > 160) {
      return feedbackResult(false, 'Informasi kontak maksimal 160 karakter.');
    }

    const attachments = [];
    if (data.screenshotData) {
      const mimeType = String(data.screenshotType || '');
      const fileName = String(data.screenshotName || 'screenshot').replace(/[^\w.-]/g, '_').slice(0, 120);
      const encodedScreenshot = String(data.screenshotData);
      if (['image/png', 'image/jpeg', 'image/webp'].indexOf(mimeType) === -1) {
        return feedbackResult(false, 'Format screenshot harus PNG, JPG, atau WebP.');
      }
      if (encodedScreenshot.length > Math.ceil(MAX_SCREENSHOT_BYTES / 3) * 4) {
        return feedbackResult(false, 'Ukuran screenshot maksimal 3 MB.');
      }

      const bytes = Utilities.base64Decode(encodedScreenshot);
      if (bytes.length > MAX_SCREENSHOT_BYTES) {
        return feedbackResult(false, 'Ukuran screenshot maksimal 3 MB.');
      }
      attachments.push(Utilities.newBlob(bytes, mimeType, fileName));
    }

    if (!reserveDailyCapacity()) {
      return feedbackResult(false, 'Masukan sedang dibatasi. Silakan coba kembali besok.');
    }

    const body = [
      'Masukan baru untuk CHROMARA',
      '',
      'Kategori: ' + category,
      'Pesan / Keluhan:',
      message,
      '',
      'Email / Kontak: ' + (contact || 'Tidak diisi'),
      'Screenshot: ' + (attachments.length ? 'Terlampir' : 'Tidak ada')
    ].join('\n');

    MailApp.sendEmail({
      to: FEEDBACK_RECIPIENT,
      subject: '[CHROMARA] ' + category,
      body: body,
      attachments: attachments
    });

    return feedbackResult(true, 'Terima kasih. Masukan Anda berhasil dikirim.');
  } catch (error) {
    console.error(error);
    return feedbackResult(false, 'Masukan belum terkirim. Silakan coba kembali nanti.');
  }
}

function reserveDailyCapacity() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return false;

  try {
    const properties = PropertiesService.getScriptProperties();
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const key = 'feedback-count-' + today;
    const count = Number(properties.getProperty(key) || 0);
    if (count >= DAILY_LIMIT) return false;
    properties.setProperty(key, String(count + 1));
    return true;
  } finally {
    lock.releaseLock();
  }
}

function feedbackResult(ok, message) {
  const payload = JSON.stringify({
    type: 'chromara-feedback-result',
    ok: ok,
    message: message
  }).replace(/</g, '\\u003c');
  const html = '<!doctype html><meta charset="utf-8"><script>' +
    'window.top.postMessage(' + payload + ',"https://raihhazmi.github.io");' +
    '</script><p>Pengiriman selesai. Anda dapat kembali ke CHROMARA.</p>';

  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
